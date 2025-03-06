import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';

export const ShareFile = async (filePath: string): Promise<void> => {
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

export const ShareFiles = async (filePaths: string[]): Promise<void> => {
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
