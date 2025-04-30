import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export async function createThumbnail(
  uri: string,
  jobName: string,
  width = 100,
  height = 100,
): Promise<string | undefined> {
  let thumbnailUrlInBase64: string | undefined = undefined;

  try {
    let thumbnailUri: string | undefined = undefined;

    // Copy the original image
    thumbnailUri = `${FileSystem.documentDirectory}Thumbnail_${jobName}.jpg`;
    console.log(`Creating thumbnail for ${uri}...`);
    console.log(`   by copying thumbnail file to ${thumbnailUri}...`);

    await FileSystem.copyAsync({ from: uri, to: thumbnailUri });

    // Manipulate the copied image to create a thumbnail
    const manipulationContext = await ImageManipulator.ImageManipulator.manipulate(thumbnailUri);

    manipulationContext.resize({ width, height });

    thumbnailUrlInBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (thumbnailUrlInBase64) {
      await FileSystem.deleteAsync(thumbnailUri);
    }
  } catch (error) {
    console.error(`Error creating thumbnail: ${error}`);
    thumbnailUrlInBase64 = undefined;
  }

  return thumbnailUrlInBase64;
}
