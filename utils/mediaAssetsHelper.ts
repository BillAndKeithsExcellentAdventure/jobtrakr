import * as MediaLibrary from 'expo-media-library';

export type MediaAssetPage = {
  assets: MediaLibrary.Asset[];
  endCursor?: string;
  hasNextPage: boolean;
};

export class MediaAssetsHelper {
  public async getAssetPageWithInfo(options: {
    pageSize?: number;
    after?: string;
    mediaTypes?: MediaLibrary.MediaTypeValue[];
    sortBy?: MediaLibrary.SortByKey;
  }): Promise<MediaAssetPage> {
    const {
      pageSize = 20,
      after,
      mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy = MediaLibrary.SortBy.creationTime,
    } = options;

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: pageSize,
        after,
        mediaType: mediaTypes,
        sortBy,
      });
      return {
        assets: result.assets,
        endCursor: result.endCursor,
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      console.error('Error in getAssetPageWithInfo:', error);
      return { assets: [], endCursor: undefined, hasNextPage: false };
    }
  }

  public async getAssetsNearLocationWithInfo(
    longitude: number,
    latitude: number,
    distance: number,
    options?: {
      pageSize?: number;
      after?: string;
      statusFunction?: (status: string) => void;
    },
  ): Promise<MediaAssetPage> {
    const pageSize = options?.pageSize ?? 100;
    const after = options?.after;
    const statusFunction = options?.statusFunction;

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: pageSize,
        after,
      });

      if (statusFunction) {
        statusFunction(`Fetched ${result.assets.length} assets`);
      }

      const filteredAssets: MediaLibrary.Asset[] = [];
      for (const asset of result.assets) {
        const location: { latitude: number; longitude: number } | null = await this.getAssetLocation(
          asset.id,
        );
        if (location) {
          const distanceInMeters = this.getDistanceBetweenPoints({ longitude, latitude }, location);
          if (distanceInMeters <= distance) {
            filteredAssets.push(asset);
            if (statusFunction) {
              statusFunction(
                `Added asset within distance of ${distance}.\nTotal assets found: ${filteredAssets.length}`,
              );
            }
          }
        }
      }

      return {
        assets: filteredAssets,
        endCursor: result.endCursor,
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      console.error('Error in getAssetsNearLocationWithInfo:', error);
      return { assets: [], endCursor: undefined, hasNextPage: false };
    }
  }

  public async getAssetLocation(assetId: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      if (asset && asset.location) {
        return {
          latitude: asset.location.latitude,
          longitude: asset.location.longitude,
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching asset location: ${error}`);
      return null;
    }
  }

  public async getAssetById(assetId: string, albumId: string): Promise<MediaLibrary.Asset | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      if (asset && asset.albumId === albumId) {
        return asset;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching asset by ID: ${error}`);
      return null;
    }
  }

  private getDistanceBetweenPoints(
    point1: { longitude: number; latitude: number },
    point2: { longitude: number; latitude: number },
  ): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const R = 6371e3; // Earth radius in meters
    const φ1 = toRadians(point1.latitude);
    const φ2 = toRadians(point2.latitude);
    const Δφ = toRadians(point2.latitude - point1.latitude);
    const Δλ = toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in meters
    return distance;
  }
}
