import { API_CONFIG } from '../utils/constants';
import { getAuthToken, removeAuthToken } from '../utils/localStorage';
import type { ApiResponse, ApiError, RequestConfig } from '../types/api';

/**
 * HTTP Client class for API communication
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Create request with timeout
   */
  private createRequestWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = this.timeout
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeoutMs);

      fetch(url, options)
        .then(response => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any;
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - remove token and redirect to login
      if (response.status === 401) {
        removeAuthToken();
        this.removeAuthToken();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      const error: ApiError = {
        message: data.message || data.error || 'An error occurred',
        status: response.status,
        code: data.code,
        details: data.details,
      };

      throw error;
    }

    return data;
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          const value = params[key];
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        }
      }
    }
    
    return url.toString();
  }

  /**
   * Make HTTP request
   */
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { url, method, data, params, headers = {}, timeout } = config;
    
    const fullUrl = this.buildUrl(url, params);
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      if (data instanceof FormData) {
        // Remove Content-Type for FormData to let browser set boundary
        delete requestHeaders['Content-Type'];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    try {
      const response = await this.createRequestWithTimeout(fullUrl, options, timeout);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Transform fetch errors into ApiError format
      if (error instanceof Error) {
        const apiError: ApiError = {
          message: error.message,
          status: 0,
        };
        throw apiError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', params, headers });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, headers });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', headers });
  }

  /**
   * Upload file
   */
  async upload<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      for (const key in additionalData) {
        if (additionalData.hasOwnProperty(key)) {
          formData.append(key, String(additionalData[key]));
        }
      }
    }

    return this.request<T>({ url, method: 'POST', data: formData });
  }

  /**
   * Download file
   */
  async download(url: string, params?: Record<string, any>): Promise<Blob> {
    const fullUrl = this.buildUrl(url, params);
    const token = getAuthToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.createRequestWithTimeout(fullUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Check if API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
