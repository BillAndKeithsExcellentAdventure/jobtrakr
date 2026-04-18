/**
 * Tests for API utilities with token handling
 */
import { createApiWithToken } from '@/src/utils/apiWithToken';
import {
  mockApiSuccess,
  mockApiError,
  mockApiTimeout,
  resetApiMocks,
  createMockGetToken,
} from '@/__mocks__/apiMocks';

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
        }),
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
        }),
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
        }),
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
        }),
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

    it('should retry once with a refreshed token on 403 responses', async () => {
      const mockGetToken = jest
        .fn<Promise<string | null>, [options?: { skipCache?: boolean; template?: string }]>()
        .mockResolvedValueOnce('stale-token')
        .mockResolvedValueOnce('fresh-token');
      const apiFetch = createApiWithToken(mockGetToken);

      (global.fetch as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: jest.fn().mockResolvedValue('Forbidden'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

      const response = await apiFetch('https://api.example.com/test', {
        method: 'GET',
      });

      expect(mockGetToken).toHaveBeenNthCalledWith(1);
      expect(mockGetToken).toHaveBeenNthCalledWith(2, { skipCache: true });
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer stale-token',
          }),
        }),
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fresh-token',
          }),
        }),
      );
      expect(response.ok).toBe(true);
    });

    it('should not retry when refreshed token is unchanged', async () => {
      const mockGetToken = jest
        .fn<Promise<string | null>, [options?: { skipCache?: boolean; template?: string }]>()
        .mockResolvedValue('same-token');
      const apiFetch = createApiWithToken(mockGetToken);

      mockApiError(403, 'Forbidden');

      const response = await apiFetch('https://api.example.com/test', {
        method: 'GET',
      });

      expect(mockGetToken).toHaveBeenNthCalledWith(1);
      expect(mockGetToken).toHaveBeenNthCalledWith(2, { skipCache: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(403);
    });

    it('should handle network timeouts', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const apiFetch = createApiWithToken(mockGetToken);

      mockApiTimeout();

      await expect(
        apiFetch('https://api.example.com/test', {
          method: 'GET',
        }),
      ).rejects.toThrow('Network request timed out');
    });

    it('should handle token retrieval failures', async () => {
      const mockGetToken = createMockGetToken('', true);
      const apiFetch = createApiWithToken(mockGetToken);

      await expect(
        apiFetch('https://api.example.com/test', {
          method: 'GET',
        }),
      ).rejects.toThrow('Failed to get token');
    });
  });
});
