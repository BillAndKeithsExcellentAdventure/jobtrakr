import { View, Text } from '@/components/Themed';
import { ReceiptData } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { buildLocalImageUri } from '@/utils/images';
import React from 'react';
import { TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import Base64Image from './Base64Image';

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
  const uri = buildLocalImageUri(orgId, projectId, item.imageId, 'receipt');
  console.log(`ReceiptSummary: uri: ${uri}`);
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.imageContentContainer}>
        {item.imageId ? (
          <TouchableWithoutFeedback onPress={() => onShowPicture(uri!)}>
            <Base64Image base64String={item.thumbnail} height={80} width={120} />
          </TouchableWithoutFeedback>
        ) : (
          <Text txtSize="sub-title">No Image</Text>
        )}
      </View>
      <View style={[{ flex: 1, alignItems: 'flex-start' }, !!!item.amount && { alignItems: 'center' }]}>
        <TouchableWithoutFeedback onPress={() => onShowDetails(item)}>
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
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
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
