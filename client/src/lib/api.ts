import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Token will be set dynamically by AuthTokenSync component
let authToken: string | null = null;
let tokenReady = false;

// Promise that resolves once the first token sync completes
let tokenReadyResolve: (() => void) | null = null;
const tokenReadyPromise = new Promise<void>((resolve) => {
  tokenReadyResolve = resolve;
});

export function setAuthToken(token: string | null) {
  authToken = token;
  if (!tokenReady && tokenReadyResolve) {
    tokenReady = true;
    tokenReadyResolve();
  }
}

export function isTokenReady(): boolean {
  return tokenReady;
}

// Request interceptor: wait for token to be ready, then attach it
api.interceptors.request.use(async (config) => {
  // Wait for the first token sync before making any API call
  if (!tokenReady) {
    await tokenReadyPromise;
  }
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for error handling
// IMPORTANT: Do NOT auto-redirect on 401 — that causes infinite reload loops
// when the token hasn't been synced yet. Let the Clerk middleware handle auth redirects.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 401s for debugging but don't auto-redirect
    if (error.response?.status === 401) {
      console.warn('API returned 401 — auth token may be expired');
    }
    return Promise.reject(error);
  }
);

export default api;
