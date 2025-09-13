// Configuration for different environments
export const config = {
  // API Base URL - will be set at build time or runtime
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://1c4i2e9ym1.execute-api.us-east-1.amazonaws.com/prod',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Feature flags
  features: {
    enableChat: true,
    enableSuggestions: true,
    enableAnalytics: false,
  }
};

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = config.apiBaseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
