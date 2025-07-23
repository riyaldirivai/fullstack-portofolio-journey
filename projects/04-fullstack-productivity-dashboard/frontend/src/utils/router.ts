import { routes } from '../App';

export interface RouteParams {
  [key: string]: string;
}

export interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
  params: RouteParams;
}

/**
 * Simple router implementation for handling client-side routing
 */
export class Router {
  private routes: any[];
  private currentLocation: RouterLocation;
  private listeners: Array<(location: RouterLocation) => void>;

  constructor() {
    this.routes = routes;
    this.listeners = [];
    this.currentLocation = this.parseLocation(window.location);

    // Listen for browser navigation events
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for browser navigation
   */
  private setupEventListeners(): void {
    window.addEventListener('popstate', () => {
      this.currentLocation = this.parseLocation(window.location);
      this.notifyListeners();
    });

    // Handle link clicks with data-route attribute
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('[data-route]');
      
      if (link) {
        event.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) {
          this.push(route);
        }
      }
    });
  }

  /**
   * Parse window location into RouterLocation object
   */
  private parseLocation(location: Location): RouterLocation {
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;
    
    // Extract route parameters
    const params = this.extractParams(pathname);

    return {
      pathname,
      search,
      hash,
      params
    };
  }

  /**
   * Extract parameters from pathname
   */
  private extractParams(pathname: string): RouteParams {
    const params: RouteParams = {};
    
    // Simple parameter extraction for routes like /users/:id
    const route = this.findMatchingRoute(pathname);
    if (route && route.path.includes(':')) {
      const routeSegments = route.path.split('/');
      const pathSegments = pathname.split('/');
      
      routeSegments.forEach((segment: string, index: number) => {
        if (segment.startsWith(':')) {
          const paramName = segment.slice(1);
          params[paramName] = pathSegments[index] || '';
        }
      });
    }

    return params;
  }

  /**
   * Find matching route for given pathname
   */
  private findMatchingRoute(pathname: string): any | null {
    for (const route of this.routes) {
      if (this.isRouteMatch(route.path, pathname)) {
        return route;
      }
      
      if (route.children) {
        for (const childRoute of route.children) {
          if (this.isRouteMatch(childRoute.path, pathname)) {
            return childRoute;
          }
        }
      }
    }
    return null;
  }

  /**
   * Check if route path matches pathname
   */
  private isRouteMatch(routePath: string, pathname: string): boolean {
    // Exact match
    if (routePath === pathname) {
      return true;
    }

    // Parameter match (e.g., /users/:id matches /users/123)
    if (routePath.includes(':')) {
      const routeSegments = routePath.split('/');
      const pathSegments = pathname.split('/');
      
      if (routeSegments.length !== pathSegments.length) {
        return false;
      }
      
      return routeSegments.every((segment, index) => {
        return segment.startsWith(':') || segment === pathSegments[index];
      });
    }

    // Prefix match for parent routes
    return pathname.startsWith(routePath);
  }

  /**
   * Navigate to a new path
   */
  public push(path: string): void {
    if (path !== this.currentLocation.pathname) {
      window.history.pushState(null, '', path);
      this.currentLocation = this.parseLocation(window.location);
      this.notifyListeners();
    }
  }

  /**
   * Replace current path
   */
  public replace(path: string): void {
    window.history.replaceState(null, '', path);
    this.currentLocation = this.parseLocation(window.location);
    this.notifyListeners();
  }

  /**
   * Go back in history
   */
  public back(): void {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  public forward(): void {
    window.history.forward();
  }

  /**
   * Get current location
   */
  public getLocation(): RouterLocation {
    return { ...this.currentLocation };
  }

  /**
   * Get query parameters from current location
   */
  public getQuery(): URLSearchParams {
    return new URLSearchParams(this.currentLocation.search);
  }

  /**
   * Add listener for location changes
   */
  public listen(listener: (location: RouterLocation) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of location change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentLocation);
      } catch (error) {
        console.error('Router listener error:', error);
      }
    });
  }

  /**
   * Generate URL with query parameters
   */
  public createUrl(path: string, params?: Record<string, string>): string {
    let url = path;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += '?' + searchParams.toString();
    }
    
    return url;
  }

  /**
   * Check if current route is active
   */
  public isActive(path: string, exact: boolean = false): boolean {
    if (exact) {
      return this.currentLocation.pathname === path;
    }
    return this.currentLocation.pathname.startsWith(path);
  }
}

// Create global router instance
export const router = new Router();

// Export utility functions
export const navigate = (path: string) => router.push(path);
export const replace = (path: string) => router.replace(path);
export const goBack = () => router.back();
export const goForward = () => router.forward();
export const getLocation = () => router.getLocation();
export const getQuery = () => router.getQuery();
export const isActive = (path: string, exact?: boolean) => router.isActive(path, exact);
export const createUrl = (path: string, params?: Record<string, string>) => router.createUrl(path, params);

export default Router;
