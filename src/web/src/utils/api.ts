// API base URL - use environment variables or defaults
const getApiBaseUrl = (): string => {
  // Priority 1: Explicit VITE_API_URL (set at build time for all environments)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: In production, try same-origin (frontend and backend on same domain)
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Use current origin (works for same-domain deployments)
    return window.location.origin;
  }
  
  // Priority 3: Development fallback to localhost
  const port = import.meta.env.VITE_PORT_BACKEND || '8000';
  return `http://localhost:${port}`;
};

const API_BASE_URL = getApiBaseUrl();

export const apiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('synapse_auth_token');
};

// Enhanced fetch wrapper that automatically includes auth headers
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = apiUrl(path);
  const token = getAuthToken();

  // Public endpoints that don't require authentication
  const publicPaths = ['/api/auth/login', '/api/health', '/api/openapi', '/api/docs'];
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add Content-Type if not present and body is provided
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add Authorization header for protected endpoints
  if (!isPublicPath && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - clear auth and redirect to login
  if (response.status === 401 && !isPublicPath) {
    localStorage.removeItem('synapse_auth_token');
    localStorage.removeItem('synapse_auth_user');
    
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/';
    }
  }

  return response;
};

