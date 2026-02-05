import { Text, View } from '@/src/components/Themed';
import { ReceiptData } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useColors } from '../context/ColorsContext';
import Base64Image from './Base64Image';
import { SvgImage } from './SvgImage';

interface ReceiptSummaryProps {
  item: ReceiptData;
  onShowReceipt: (uri: string) => void;
  onShowDetails: (item: ReceiptData) => void;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ item, onShowReceipt, onShowDetails }) => {
  const colors = useColors();
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.imageContentContainer}>
        {item.imageId ? (
          <Pressable onPress={() => onShowReceipt(item.imageId)}>
            <Base64Image base64String={item.thumbnail} height={80} width={120} />
          </Pressable>
        ) : (
          <Pressable onPress={() => onShowReceipt(item.imageId)}>
            <View
              style={{
                borderWidth: 1,
                borderRadius: 5,
                paddingHorizontal: 5,
                paddingVertical: 10,
                borderColor: colors.border,
              }}
            >
              <Text txtSize="sub-title" text="Add Image" />
            </View>
          </Pressable>
        )}
      </View>
      <View style={[{ flex: 1, alignItems: 'flex-start' }, !!!item.amount && { alignItems: 'center' }]}>
        {0 !== item.amount || item.description?.length > 0 ? (
          <Pressable onPress={() => onShowDetails(item)} style={{ flex: 1, justifyContent: 'center' }}>
            {item.accountingId && (
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <SvgImage fileName="qb-logo" width={20} height={20} />
                <Text>{`${item.accountingId}`}</Text>
              </View>
            )}
            {item.amount > 0 && <Text text={`${formatCurrency(item.amount, true, true)}`} />}
            {item.vendor && <Text numberOfLines={1} text={`${item.vendor}`} />}
            {item.description && <Text numberOfLines={1} text={`${item.description}`} />}
          </Pressable>
        ) : (
          <Pressable onPress={() => onShowDetails(item)} style={{ flex: 1, justifyContent: 'center' }}>
            <Text txtSize="sub-title" text="Add details..." />
          </Pressable>
        )}
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
