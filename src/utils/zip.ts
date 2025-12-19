import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import * as MediaLibrary from 'expo-media-library';

interface PictureBucketAsset {
  _id?: string | null;
  asset?: MediaLibrary.Asset;
}

export const countFiles = async (folderPath: string): Promise<number> => {
  try {
    const result = await FileSystem.readDirectoryAsync(folderPath);
    const fileCount = result.length;
    console.log(`Found ${fileCount} files in ${folderPath}`);
    return fileCount;
  } catch (error) {
    console.error('Error counting files:', error);
    return 0;
  }
};

interface ZipResult {
  zipFiles: string[];
  totalSize: number;
}

async function createZipFromFiles(files: string[], baseZipUri: string): Promise<ZipResult> {
  const MAX_ZIP_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const chunkSize = 1024 * 1024; // 1MB chunks
  let currentZip = new JSZip();
  let currentZipSize = 0;
  let zipIndex = 1;
  const createdZipFiles: string[] = [];
  let totalSize = 0;

  // Function to save current zip and start a new one
  const saveCurrentZip = async (): Promise<void> => {
    if (currentZipSize > 0) {
      const zipContent = await currentZip.generateAsync(
        {
          type: 'base64',
          streamFiles: true,
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          if (Math.round(metadata.percent) % 10 === 0) {
            console.log(`Zip ${zipIndex} progress: ${metadata.percent.toFixed(2)}%`);
          }
        },
      );

      const currentZipUri = `${baseZipUri}_${zipIndex}.zip`;
      await FileSystem.writeAsStringAsync(currentZipUri, zipContent, {
        encoding: FileSystem.EncodingType.Base64,
      });
      createdZipFiles.push(currentZipUri);

      // Reset for next zip file
      currentZip = new JSZip();
      currentZipSize = 0;
      zipIndex++;
    }
  };

  // Process each file
  for (const fileUri of files) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists || !fileInfo.size) continue;

      const fileName = fileUri.split('/').pop();
      if (!fileName) continue;

      // Check if adding this file would exceed the limit
      if (currentZipSize + fileInfo.size > MAX_ZIP_SIZE && currentZipSize > 0) {
        await saveCurrentZip();
      }

      // Read and add file in chunks
      const totalChunks = Math.ceil(fileInfo.size / chunkSize);
      let offset = 0;
      const chunks: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          length: chunkSize,
          position: offset,
        });
        chunks.push(chunk);
        offset += chunkSize;
      }

      currentZip.file(fileName, chunks.join(''), { base64: true });
      currentZipSize += fileInfo.size;
      totalSize += fileInfo.size;
    } catch (error) {
      console.error(`Failed to process file at ${fileUri}:`, error);
    }
  }

  // Save the final zip file if there's anything left
  await saveCurrentZip();

  return {
    zipFiles: createdZipFiles,
    totalSize: totalSize,
  };
}

// Update the CreateMediaZip function to handle multiple zip files
export const CreateMediaZip = async (
  assets: PictureBucketAsset[],
  zipFileName: string,
): Promise<string[]> => {
  let fileCount: number = 0;
  try {
    // Create a temporary directory to store the files
    const tempDir = `${FileSystem.cacheDirectory}temp_zip/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    fileCount = await countFiles(tempDir);
    console.log('Before fileCount:', fileCount);

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
    const copiedFiles = await Promise.all(copyPromises);

    //fileCount = await countFiles(tempDir);
    console.log('AFter fileCount:', copiedFiles.length);

    // Create the zip files
    const baseZipPath = `${FileSystem.documentDirectory}${zipFileName}`;
    const result = await createZipFromFiles(copiedFiles, baseZipPath);
    console.log(
      `Created ${result.zipFiles.length} zip files, total size: ${(result.totalSize / 1024 / 1024).toFixed(
        2,
      )}MB`,
    );
    console.log('Zip files created:', result.zipFiles);

    // Clean up temp directory
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
    return result.zipFiles;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
};
