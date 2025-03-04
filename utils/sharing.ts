import * as Sharing from 'expo-sharing';

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
