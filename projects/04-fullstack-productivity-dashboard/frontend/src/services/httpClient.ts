/**
 * API Client Implementation
 * 
 * Centralized API communication layer following the request/response flow:
 * Component → API Call → Express Route → MongoDB → Model → Controller → Response → Redux Store → UI Update
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private authToken: string | null = null;

  constructor(config: {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  }) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(config.headers);
    const timeout = config.timeout || this.timeout;
    const retries = config.retries !== undefined ? config.retries : this.retries;

    let lastError: ApiError = new Error('Unknown error');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (data && method !== 'GET') {
          requestOptions.body = JSON.stringify(data);
        }

        console.log(`🔄 API Request [${method}] ${endpoint}`, {
          attempt: attempt + 1,
          data: data || null,
          headers: this.authToken ? { ...headers, Authorization: '[REDACTED]' } : headers,
        });

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = { message: await response.text() };
        }

        if (!response.ok) {
          const error: ApiError = new Error(
            responseData.message || `HTTP ${response.status}: ${response.statusText}`
          );
          error.status = response.status;
          error.code = responseData.code;
          error.details = responseData;
          throw error;
        }

        console.log(`✅ API Response [${method}] ${endpoint}`, {
          status: response.status,
          success: responseData.success !== false,
          dataSize: responseData.data ? (Array.isArray(responseData.data) ? responseData.data.length : 'object') : null,
        });

        // Ensure consistent response format
        return {
          success: responseData.success !== false,
          data: responseData.data || responseData,
          message: responseData.message,
          pagination: responseData.pagination,
        };

      } catch (error) {
        lastError = this.createApiError(error, method, endpoint);

        console.error(`❌ API Error [${method}] ${endpoint} (Attempt ${attempt + 1})`, {
          error: lastError.message,
          status: lastError.status,
          willRetry: attempt < retries,
        });

        // Don't retry on client errors (4xx) except 408, 429
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          if (lastError.status !== 408 && lastError.status !== 429) {
            break;
          }
        }

        // Wait before retry
        if (attempt < retries) {
          const delay = config.retryDelay || this.retryDelay;
          await this.sleep(delay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Return error response
    return {
      success: false,
      error: lastError.message,
      data: lastError.details,
    };
  }

  private createApiError(error: any, method: string, endpoint: string): ApiError {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError: ApiError = new Error(`Request timeout: ${method} ${endpoint}`);
      timeoutError.status = 408;
      timeoutError.code = 'TIMEOUT';
      return timeoutError;
    }

    if (error.status) {
      return error; // Already an ApiError
    }

    const networkError: ApiError = new Error(`Network error: ${method} ${endpoint} - ${error.message}`);
    networkError.status = 0;
    networkError.code = 'NETWORK_ERROR';
    networkError.details = error;
    return networkError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // Utility methods
  buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    for (const key in params) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v: any) => searchParams.append(`${key}[]`, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }

    return searchParams.toString();
  }

  async uploadFile<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      for (const key in additionalData) {
        const value = additionalData[key];
        formData.append(key, String(value));
      }
    }

    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Upload failed: ${response.statusText}`);
      }

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; latency: number; timestamp: string }> {
    const start = performance.now();
    
    try {
      const response = await this.get('/health', { timeout: 5000 });
      const latency = Math.round(performance.now() - start);
      
      return {
        healthy: response.success,
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latency = Math.round(performance.now() - start);
      return {
        healthy: false,
        latency,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create HTTP client instance
const httpClient = new HttpClient({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
});

// Export HTTP client
export { httpClient };
export default httpClient;
