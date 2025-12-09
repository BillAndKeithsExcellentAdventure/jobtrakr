import { View, Text } from '@/src/components/Themed';
import { InvoiceData } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Base64Image from './Base64Image';
import { useColors } from '../context/ColorsContext';

interface InvoiceSummaryProps {
  item: InvoiceData;
  onShowInvoice: (uri: string) => void;
  onShowDetails: (item: InvoiceData) => void;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ item, onShowInvoice, onShowDetails }) => {
  const colors = useColors();
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.imageContentContainer}>
        {item.imageId ? (
          <Pressable onPress={() => onShowInvoice(item.imageId)}>
            <Base64Image base64String={item.thumbnail} height={80} width={120} />
          </Pressable>
        ) : (
          <Pressable onPress={() => onShowInvoice(item.imageId)}>
            <View
              style={{
                borderWidth: 1,
                borderRadius: 5,
                paddingHorizontal: 5,
                paddingVertical: 10,
                borderColor: colors.border,
              }}
            >
              <Text txtSize="sub-title">Add Image</Text>
            </View>
          </Pressable>
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

});
