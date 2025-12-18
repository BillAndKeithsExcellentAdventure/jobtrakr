/**
 * Mock utilities for API calls and network requests in tests.
 * Use these utilities to mock fetch calls and API responses.
 */

/**
 * Creates a mock fetch response
 * @param data - The data to return from the mock response
 * @param status - HTTP status code (default: 200)
 * @param statusText - HTTP status text (default: 'OK')
 */
export const createMockResponse = (
  data: any,
  status: number = 200,
  statusText: string = 'OK'
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response;
};

/**
 * Mocks a successful API call
 * @param data - The data to return
 */
export const mockApiSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(createMockResponse(data))
  ) as jest.Mock;
};

/**
 * Mocks a failed API call
 * @param status - HTTP status code (default: 500)
 * @param message - Error message (default: 'Internal Server Error')
 */
export const mockApiError = (status: number = 500, message: string = 'Internal Server Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve(createMockResponse({ error: message }, status, message))
  ) as jest.Mock;
};

/**
 * Mocks a network timeout
 */
export const mockApiTimeout = () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network request timed out'))
  ) as jest.Mock;
};

/**
 * Mocks a network error
 */
export const mockNetworkError = () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network request failed'))
  ) as jest.Mock;
};

/**
 * Resets all fetch mocks
 */
export const resetApiMocks = () => {
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockReset();
  }
};

/**
 * Creates a mock Clerk getToken function
 * @param token - The token to return (default: 'mock-token')
 * @param shouldFail - Whether the token retrieval should fail
 */
export const createMockGetToken = (token: string = 'mock-token', shouldFail: boolean = false) => {
  if (shouldFail) {
    return jest.fn(() => Promise.reject(new Error('Failed to get token')));
  }
  return jest.fn(() => Promise.resolve(token));
};

/**
 * Creates a mock WebSocket connection
 */
export class MockWebSocket {
  readyState: number = 1; // OPEN
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  // Simulate receiving a message
  simulateMessage(data: any) {
    const listeners = this.addEventListener.mock.calls
      .filter(call => call[0] === 'message')
      .map(call => call[1]);
    
    listeners.forEach(listener => {
      listener({ data: JSON.stringify(data) });
    });
  }

  // Simulate connection opening
  simulateOpen() {
    const listeners = this.addEventListener.mock.calls
      .filter(call => call[0] === 'open')
      .map(call => call[1]);
    
    listeners.forEach(listener => listener({}));
  }

  // Simulate connection closing
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    const listeners = this.addEventListener.mock.calls
      .filter(call => call[0] === 'close')
      .map(call => call[1]);
    
    listeners.forEach(listener => listener({}));
  }

  // Simulate error
  simulateError(error: Error) {
    const listeners = this.addEventListener.mock.calls
      .filter(call => call[0] === 'error')
      .map(call => call[1]);
    
    listeners.forEach(listener => listener({ error }));
  }
}
