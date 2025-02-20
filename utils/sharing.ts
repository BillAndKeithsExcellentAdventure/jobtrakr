import * as Sharing from 'expo-sharing';

export const ShareFile = async (filePath: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};
