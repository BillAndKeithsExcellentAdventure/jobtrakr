let mockPlatformOS: 'ios' | 'android' = 'ios';

const mockGetAssetInfoAsync = jest.fn();

jest.mock('react-native', () => {
  return {
    Platform: {
      get OS() {
        return mockPlatformOS;
      },
      select: (options: Record<string, unknown>) => options[mockPlatformOS] ?? options.default,
    },
  };
});

jest.mock('expo-media-library', () => ({
  getAssetInfoAsync: (...args: unknown[]) => mockGetAssetInfoAsync(...args),
}));

import { resolveMediaLibraryUriForDisplay } from '@/src/utils/mediaAssetsHelper';

describe('resolveMediaLibraryUriForDisplay', () => {
  beforeEach(() => {
    mockPlatformOS = 'ios';
    mockGetAssetInfoAsync.mockReset();
  });

  it('returns original URI on non-iOS platforms', async () => {
    mockPlatformOS = 'android';

    const result = await resolveMediaLibraryUriForDisplay('ph://34b');

    expect(result).toBe('ph://34b');
    expect(mockGetAssetInfoAsync).not.toHaveBeenCalled();
  });

  it('returns original URI when URI is not a ph:// URI', async () => {
    const result = await resolveMediaLibraryUriForDisplay('file:///tmp/image.jpg');

    expect(result).toBe('file:///tmp/image.jpg');
    expect(mockGetAssetInfoAsync).not.toHaveBeenCalled();
  });

  it('resolves ph:// URI using provided assetId and prefers localUri', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: 'file:///var/mobile/local.jpg',
      uri: 'ph://34b',
    });

    const result = await resolveMediaLibraryUriForDisplay('ph://34b', 'asset-123');

    expect(result).toBe('file:///var/mobile/local.jpg');
    expect(mockGetAssetInfoAsync).toHaveBeenCalledWith('asset-123');
  });

  it('derives assetId from URI when assetId is not provided', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: null,
      uri: 'assets-library://image/derived.jpg',
    });

    const result = await resolveMediaLibraryUriForDisplay('ph://derived-id');

    expect(result).toBe('assets-library://image/derived.jpg');
    expect(mockGetAssetInfoAsync).toHaveBeenCalledWith('derived-id');
  });

  it('falls back to original URI when resolver throws', async () => {
    mockGetAssetInfoAsync.mockRejectedValue(new Error('mock failure'));

    const result = await resolveMediaLibraryUriForDisplay('ph://bad-id');

    expect(result).toBe('ph://bad-id');
    expect(mockGetAssetInfoAsync).toHaveBeenCalledWith('bad-id');
  });
});
