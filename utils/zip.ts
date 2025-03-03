import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { PictureBucketAsset } from 'jobdb';

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

// Function to create a ZIP file from a list of files
async function createZipFromFiles(files: string[], zipFileUri: string) {
  const zip = new JSZip();

  // Loop through each file URI in the list
  for (const fileUri of files) {
    try {
      // Read the file content from the file system
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get the file name from the URI (you can also change how the file is named in the ZIP)
      const fileName = fileUri.split('/').pop(); // Extracts file name from the URI

      // Add the file to the ZIP with the file name
      if (fileName) zip.file(fileName, fileContent, { base64: true });
    } catch (error) {
      console.error(`Failed to read file at ${fileUri}:`, error);
    }
  }

  // Generate the ZIP file as Base64
  const content = await zip.generateAsync({ type: 'base64' });

  // Write the ZIP file to the device file system
  await FileSystem.writeAsStringAsync(zipFileUri, content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log(`ZIP file created at: ${zipFileUri}`);
  return zipFileUri;
}

export const CreateMediaZip = async (assets: PictureBucketAsset[], zipFileName: string): Promise<void> => {
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

    // Create the zip file
    const zipPath = `${FileSystem.documentDirectory}${zipFileName}.zip`;
    await FileSystem.deleteAsync(zipPath, { idempotent: true });

    //await ZipArchive.zip(tempDir, zipPath);
    const zipFileUri = await createZipFromFiles(copiedFiles, zipPath);

    // Clean up temp directory
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
};
