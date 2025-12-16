/**
 * Utility for making API calls with automatic token refresh on 401/403 errors.
 * This module provides a wrapper around the fetch API that automatically refreshes
 * the Clerk authentication token when it expires and retries the failed request.
 */

/**
 * Default timeout for network requests in milliseconds.
 * Set to 15 seconds to fail fast when network is unavailable.
 */
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Creates a fetch request with a timeout.
 * If the request takes longer than the timeout, it will be aborted and throw an error.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 15000)
 * @returns Promise that resolves to the fetch Response
 * @throws Error if the request times out or network is unavailable
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Check if the error is due to abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Network request timed out after ${timeoutMs}ms. Please check your internet connection.`);
    }
    throw error;
  }
}

/**
 * Makes an API call with automatic token refresh on 401/403 errors.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (headers, method, body, etc.)
 * @param token - The current authentication token
 * @param refreshToken - Function to refresh the authentication token (returns the new token)
 * @returns The fetch Response object
 *
 * @example
 * ```typescript
 * const { token, refreshToken } = useAuthToken();
 * const response = await fetchWithTokenRefresh(
 *   `${API_BASE_URL}/endpoint`,
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(data)
 *   },
 *   token,
 *   refreshToken
 * );
 * ```
 */
export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit,
  token: string | null,
  refreshToken: () => Promise<string | null>,
): Promise<Response> {
  // Add authorization header if token is available
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const requestOptions = {
    ...options,
    headers,
  };

  // Make the initial request with timeout
  let response = await fetchWithTimeout(url, requestOptions);

  // If we get a 401 or 403, try refreshing the token and retry once
  if (response.status === 401 || response.status === 403) {
    console.log(`Received ${response.status} error, attempting to refresh token...`);

    try {
      // Refresh the token and get the new token value
      const newToken = await refreshToken();

      // Update headers with the new token
      const retryHeaders = {
        ...options.headers,
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      };

      const retryOptions = {
        ...options,
        headers: retryHeaders,
      };

      // Retry the request with the new token
      response = await fetchWithTimeout(url, retryOptions);
      console.log('Token refresh and retry completed');
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  }

  return response;
}

/**
 * A higher-order function that returns an API caller with automatic token refresh.
 * This version allows the caller to automatically retry with a refreshed token.
 *
 * @param getToken - Function to get the current token
 * @param refreshToken - Function to refresh the token (returns the new token value)
 * @returns A function that makes API calls with automatic retry on auth errors
 *
 * @example
 * ```typescript
 * const { token, refreshToken } = useAuthToken();
 * const apiFetch = createApiWithRetry(token, refreshToken);
 *
 * const response = await apiFetch(`${API_BASE_URL}/endpoint`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export function createApiWithRetry(
  token: string | null,
  refreshToken: () => Promise<string | null>,
): (url: string, options: RequestInit) => Promise<Response> {
  return async (url: string, options: RequestInit): Promise<Response> => {
    const makeRequest = async (currentToken: string | null): Promise<Response> => {
      const headers = {
        ...options.headers,
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      };

      const requestOptions = {
        ...options,
        headers,
      };

      return await fetchWithTimeout(url, requestOptions);
    };

    // Make the initial request
    let response = await makeRequest(token);

    // If we get a 401 or 403, try refreshing the token and retry once
    const hasRetryHeader =
      typeof options.headers === 'object' &&
      options.headers !== null &&
      'X-Retry-After-Refresh' in options.headers;
    if ((response.status === 401 || response.status === 403) && !hasRetryHeader) {
      console.log(`Received ${response.status} error, attempting to refresh token and retry...`);

      try {
        // Refresh the token and get the new token value
        const newToken = await refreshToken();

        // Add a header to prevent infinite retry loops
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            'X-Retry-After-Refresh': 'true',
          },
        };

        // Retry with the refreshed token (use the returned value, not getToken())
        response = await makeRequest(newToken);
        console.log('Retry after token refresh completed');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Return the original failed response
      }
    }

    return response;
  };
}
