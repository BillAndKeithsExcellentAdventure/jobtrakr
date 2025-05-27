import { View, Text } from '@/components/Themed';
import { ReceiptData } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { buildLocalImageUri, useGetImageCallback } from '@/utils/images';
import React, { useEffect, useState } from 'react';
import { TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Base64Image from './Base64Image';
import * as FileSystem from 'expo-file-system';

interface ReceiptSummaryProps {
  orgId: string;
  projectId: string;
  item: ReceiptData;
  onShowPicture: (uri: string) => void;
  onShowDetails: (item: ReceiptData) => void;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  orgId,
  projectId,
  item,
  onShowPicture,
  onShowDetails,
}) => {
  const [uri, setUri] = useState<string>();
  const getImage = useGetImageCallback();

  useEffect(() => {
    const fetchImage = async () => {
      const uri = buildLocalImageUri(orgId, projectId, item.imageId, 'receipt');

      if (uri.startsWith('file://')) {
        // This is a local file. We need to check if it exists.
        const fileUri = uri.replace('file://', '');
        console.log('*** File URI:', fileUri);
        // Check if the file exists

        await FileSystem.getInfoAsync(fileUri).then(async (fileInfo) => {
          if (!fileInfo.exists) {
            // File does not exist, so we need to call our backend to retrieve it.
            console.log('*** File does not exist. Need to retrieve from backend.');
            // Call your backend API to retrieve the file and save it locally
            // After retrieving the file, you can navigate to the image viewer
            const result = await getImage(projectId, item.imageId, 'receipt');
            if (result.result.status !== 'Success') {
              console.error('*** Error retrieving receipt image from backend:', result.result.msg);
            }
          }
        });

        setUri(fileUri);
      }
    };
    fetchImage();
  }, [orgId, projectId, item.imageId]);

  console.log(`ReceiptSummary: uri: ${uri}`);
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.imageContentContainer}>
        {item.imageId ? (
          <Pressable onPress={() => onShowPicture(uri!)}>
            <Base64Image base64String={item.thumbnail} height={80} width={120} />
          </Pressable>
        ) : (
          <Text txtSize="sub-title">No Image</Text>
        )}
      </View>
      <View style={[{ flex: 1, alignItems: 'flex-start' }, !!!item.amount && { alignItems: 'center' }]}>
        <Pressable onPress={() => onShowDetails(item)}>
          {item.amount ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text>Amount: {formatCurrency(item.amount, true, true)}</Text>
              <Text>Vendor: {item.vendor}</Text>
              <Text>Description: {item.description}</Text>
              {item.notes && <Text>Notes: {item.notes}</Text>}
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text txtSize="sub-title">No details</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContentContainer: {
    marginRight: 10,
    width: 120,
    maxHeight: 110,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    padding: 10,
    height: 100,
  },
});
