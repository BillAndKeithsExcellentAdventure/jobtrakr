import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';

export const shareFile = async (filePath: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
      console.log('File share completed:', filePath);
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};

export const shareFiles = async (filePaths: string[]): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      const shareOptions = {
        title: 'Check out this album!',
        message: 'Here are some great photos.',
        urls: filePaths, // Supports multiple files
      };

      await Share.open(shareOptions);
      console.log('File shares completed:', filePaths);
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};

/**
 * Shares an HTML file using expo-sharing with a custom dialog title.
 * @param filePath - The path to the HTML file.
 * @param dialogTitle - The title for the sharing dialog.
 */
export const shareHtmlFile = async (filePath: string, dialogTitle: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/html',
        dialogTitle,
      });
      console.log('HTML file shared:', filePath);
    }
  } catch (error) {
    console.error('Error sharing HTML file:', error);
    throw error;
  }
};
