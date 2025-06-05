import * as ImageManipulator from 'expo-image-manipulator';

export async function createThumbnail(uri: string, width = 320, height = 320): Promise<string | undefined> {
  let thumbnailUrlInBase64: string | undefined = undefined;

  try {
    const manipulationContext = await ImageManipulator.ImageManipulator.manipulate(uri);
    await manipulationContext.resize({ width, height });
    const imageResult = await (await manipulationContext.renderAsync()).saveAsync({ base64: true });
    //console.log(`Creating thumbnail ...Base64 Length: ${imageResult.base64?.length}`);
    thumbnailUrlInBase64 = imageResult.base64;
  } catch (error) {
    console.error(`Error creating thumbnail: ${error}`);
    thumbnailUrlInBase64 = undefined;
  }

  return thumbnailUrlInBase64;
}
