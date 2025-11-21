import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

type GetTokenString = (token: string) => string;

/**
 * Generates an HTML file by replacing tokens in a template HTML file.
 * @param outputFileName The name of the output HTML file.
 * @param templateHtmlFile The path to the template HTML file.
 * @param getTokenString A function that returns the replacement string for a given token.
 * @returns The path to the generated HTML file.
 */
export async function createHtmlFile(
  outputFileName: string,
  templateHtml: string,
  getTokenString: GetTokenString,
): Promise<string> {
  // Replace tokens in the format {{TOKEN_NAME}}
  const replacedContent = templateHtml.replace(/{{(.*?)}}/g, (_, token) => {
    return getTokenString(token.trim());
  });

  console.log(replacedContent);

  // Write the replaced content to the output file
  const outputPath = FileSystem.documentDirectory + outputFileName;
  await FileSystem.writeAsStringAsync(outputPath, replacedContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return outputPath;
}

export async function loadTemplateHtmlAssetFileToString(): Promise<string> {
  const asset = Asset.fromModule(require('../../assets/templates/changeOrder.html'));
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Asset localUri is undefined. Check if the asset exists and is bundled correctly.');
  }
  const content = await FileSystem.readAsStringAsync(asset.localUri);
  return content;
}
