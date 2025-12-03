// API base URL - use relative path in production, localhost in development
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export const apiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

