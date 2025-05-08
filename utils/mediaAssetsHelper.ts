import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Stack } from './stack';

export type MediaAssetPage = {
  assets: MediaLibrary.Asset[];
  endCursor?: string;
  hasNextPage: boolean;
};

export class MediaAssetsHelper {
  private _hasNextPage = true;
  private _after: string | undefined = undefined;
  private _pageSize: number = 0;
  private _stack: Stack<string | undefined>;

  constructor() {
    console.log('MediaAssetsHelper constructor');

    this._pageSize = 10;
    this._hasNextPage = true;
    this._after = undefined;
    this._stack = new Stack<string>();

    this.getFirstAssetPage = this.getFirstAssetPage.bind(this);
    this.getNextAssetPage = this.getNextAssetPage.bind(this);

    console.log('MediaAssetsHelper ended constructor');
  }

  public setPageSize(pageSize: number) {
    this._pageSize = pageSize;
  }

  public async getFirstAssetPage(pageSize: number): Promise<MediaLibrary.Asset[]> {
    this._pageSize = pageSize;
    this._hasNextPage = true;
    this._after = undefined;

    const result = await this.getNextAssetPage();
    console.log('Got first page of assets with size: ' + result?.length);
    return result ? result : [];
  }

  public async getNextAssetPage(): Promise<MediaLibrary.Asset[]> {
    this._stack.push(this._after);

    console.log('Getting next assets with page size: ' + this._pageSize);
    console.log('  HasNextPage: ' + this._hasNextPage);

    console.log(`  stack size: ${this._stack.size()}`);
    for (let i = 0; i < this._stack.size(); i++) {
      console.log(`  stack[${i}]: ${this._stack.get(i)}`);
    }

    if (this._hasNextPage) {
      const result = await this.getAssetPage(this._pageSize, this._after);
      this._hasNextPage = result.hasNextPage;
      this._after = result.endCursor;

      return result.assets;
    }

    return [];
  }

  public async getPreviousAssetPage(): Promise<MediaLibrary.Asset[] | undefined> {
    if (this._stack.isEmpty()) {
      return undefined;
    }

    this._stack.pop();
    let prev = this._stack.peek();

    console.log('Getting previous assets with page size: ' + this._pageSize);
    console.log(`  stack size: ${this._stack.size()}`);
    for (let i = 0; i < this._stack.size(); i++) {
      console.log(`  stack[${i}]: ${this._stack.get(i)}`);
    }

    console.log('  cursor length: ' + prev?.length);
    if (this._stack.size() > 0) {
      this._after = prev?.length === undefined ? undefined : prev;
      console.log('  this._after: ' + this._after);
      return (await this.getAssetPage(this._pageSize, this._after)).assets;
    }

    return undefined;
  }

  private async getAssetPage(
    pageSize: number,
    pageCursor: string | undefined,
  ): Promise<MediaLibrary.PagedInfo<MediaLibrary.Asset>> {
    console.log('getAssetPage: page size: ' + pageSize);
    console.log('getAssetPage: page cursor: ' + pageCursor);

    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: pageSize,
        after: pageCursor,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      return result;
    } catch (error) {
      console.error(`Error fetching asset page: ${error}`);
      throw error;
    }
  }

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

  async getAllAssets(): Promise<MediaLibrary.Asset[]> {
    let assets: MediaLibrary.Asset[] = [];
    let hasNextPage = true;
    let after: string | undefined = undefined;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        after: after,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      assets = assets.concat(result.assets);
      hasNextPage = result.hasNextPage;
      after = result.endCursor;
    }

    return assets;
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
}
