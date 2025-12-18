/**
 * Tests for API utilities with token handling
 */
import { createApiWithToken } from '@/src/utils/apiWithToken';
import { mockApiSuccess, mockApiError, mockApiTimeout, resetApiMocks, createMockGetToken } from '@/__mocks__/apiMocks';

describe('apiWithToken', () => {
  beforeEach(() => {
    resetApiMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetApiMocks();
  });

  describe('createApiWithToken', () => {
    it('should make a request with authentication token', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiSuccess({ data: 'success' });
      
      const response = await apiFetch('https://api.example.com/test', {
        method: 'GET',
      });
      
      expect(mockGetToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      const data = await response.json();
      expect(data).toEqual({ data: 'success' });
    });

    it('should make a request without token when getToken returns null', async () => {
      const mockGetToken = jest.fn(() => Promise.resolve(null));
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiSuccess({ data: 'success' });
      
      const response = await apiFetch('https://api.example.com/test', {
        method: 'GET',
      });
      
      expect(mockGetToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
      const data = await response.json();
      expect(data).toEqual({ data: 'success' });
    });

    it('should preserve existing headers', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiSuccess({ data: 'success' });
      
      await apiFetch('https://api.example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle POST requests with body', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiSuccess({ success: true });
      
      const body = JSON.stringify({ name: 'test' });
      await apiFetch('https://api.example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body,
        })
      );
    });

    it('should handle API errors', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiError(404, 'Not Found');
      
      const response = await apiFetch('https://api.example.com/test', {
        method: 'GET',
      });
      
      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    it('should handle network timeouts', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);
      
      mockApiTimeout();
      
      await expect(
        apiFetch('https://api.example.com/test', {
          method: 'GET',
        })
      ).rejects.toThrow('Network request timed out');
    });

    it('should handle token retrieval failures', async () => {
      const mockGetToken = createMockGetToken('', true);
      const apiFetch = createApiWithToken(mockGetToken);
      
      await expect(
        apiFetch('https://api.example.com/test', {
          method: 'GET',
        })
      ).rejects.toThrow('Failed to get token');
    });
  });
});
