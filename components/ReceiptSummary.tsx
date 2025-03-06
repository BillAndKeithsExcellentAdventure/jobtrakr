import { View, Text } from '@/components/Themed';
import { formatCurrency } from '@/utils/formatters';
import { ReceiptBucketData } from 'jobdb';
import React from 'react';
import { TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';

interface ReceiptSummaryProps {
  item: ReceiptBucketData;
  onShowPicture: (uri: string) => void;
  onShowDetails: (item: ReceiptBucketData) => void;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ item, onShowPicture, onShowDetails }) => {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.imageContentContainer}>
        {item.PictureUri ? (
          <TouchableWithoutFeedback onPress={() => onShowPicture(item.PictureUri!)}>
            <Image source={{ uri: item.PictureUri }} style={{ height: 80, width: 120 }} />
          </TouchableWithoutFeedback>
        ) : (
          <Text txtSize="sub-title">No Image</Text>
        )}
      </View>
      <View style={[{ flex: 1, alignItems: 'flex-start' }, !!!item.Amount && { alignItems: 'center' }]}>
        <TouchableWithoutFeedback onPress={() => onShowDetails(item)}>
          {item.Amount ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text>Amount: {formatCurrency(item.Amount, true)}</Text>
              <Text>Vendor: {item.Vendor}</Text>
              <Text>Description: {item.Description}</Text>
              {item.Notes && <Text>Notes: {item.Notes}</Text>}
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
