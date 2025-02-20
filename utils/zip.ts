import * as FileSystem from 'expo-file-system';
import * as ZipArchive from 'react-native-zip-archive';
import { PictureBucketAsset } from 'jobdb';

export const CreateMediaZip = async (assets: PictureBucketAsset[], zipFileName: string): Promise<void> => {
  try {
    // Create a temporary directory to store the files
    const tempDir = `${FileSystem.cacheDirectory}temp_zip/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

    // Copy all files to the temp directory
    const copyPromises = assets.map(async (asset, index) => {
      const extension = asset.asset?.uri.split('.').pop();
      const destPath = `${tempDir}image_${index}.${extension}`;
      if (asset.asset) {
        await FileSystem.copyAsync({
          from: asset.asset.uri,
          to: destPath,
        });
      }

      return destPath;
    });

    // Wait for all files to be copied
    await Promise.all(copyPromises);

    // Create the zip file
    const zipPath = `${FileSystem.documentDirectory}${zipFileName}.zip`;
    await ZipArchive.zip(tempDir, zipPath);

    // Clean up temp directory
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
};
