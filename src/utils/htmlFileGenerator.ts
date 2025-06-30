import * as FileSystem from 'expo-file-system';
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
  templateHtmlFile: string,
  getTokenString: GetTokenString,
): Promise<string> {
  // Read the template HTML file
  const templateContent = await FileSystem.readAsStringAsync(templateHtmlFile);

  // Replace tokens in the format {{TOKEN_NAME}}
  const replacedContent = templateContent.replace(/{{(.*?)}}/g, (_, token) => {
    return getTokenString(token.trim());
  });

  // Write the replaced content to the output file
  const outputPath = FileSystem.documentDirectory + outputFileName;
  await FileSystem.writeAsStringAsync(outputPath, replacedContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return outputPath;
}

export async function loadTemplateHtmlAssetFileToString(fileName: string): Promise<string> {
  const asset = Asset.fromModule(require(`./assets/templates/${fileName}`));
  await asset.downloadAsync();
  const content = await FileSystem.readAsStringAsync(asset.localUri!);
  return content;
}
