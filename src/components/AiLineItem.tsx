import { useColors } from '@/src/context/ColorsContext';
import { ReceiptItem } from '@/src/models/types';
import { formatCurrency } from '@/src/utils/formatters';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Text, View } from './Themed';
import { Switch } from './Switch';

interface AiLineItemProps {
  item: ReceiptItem;
  index: number;
  showTaxToggle?: boolean;
  onTaxableChange: (index: number) => void;
  onSelectItem?: (index: number) => void;
}

export const AiLineItem: React.FC<AiLineItemProps> = ({
  item,
  index,
  showTaxToggle = true,
  onTaxableChange,
  onSelectItem,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { borderColor: item.isSelected ? '#007AFF' : colors.border, borderWidth: 1, margin: 2 }, // Add subtle highlight
      ]}
    >
      <Pressable onPress={() => onSelectItem?.(index)}>
        <Text style={styles.description}>{item.description}</Text>
      </Pressable>
      <View style={styles.amountRow}>
        <Pressable onPress={() => onSelectItem?.(index)}>
          <Text style={styles.amountText}>Amt: {formatCurrency(item.amount, false, true)}</Text>
        </Pressable>
        {showTaxToggle && (
          <Switch
            value={item.taxable}
            onValueChange={() => {
              onTaxableChange(index);
            }}
          />
        )}
        <Pressable onPress={() => onSelectItem?.(index)}>
          <Text style={styles.taxText}>Tax: {formatCurrency(item.proratedTax, false, true)}</Text>
        </Pressable>
        <Pressable onPress={() => onSelectItem?.(index)}>
          <Text style={styles.totalText}>
            Total: {formatCurrency(item.amount + item.proratedTax, false, true)}
          </Text>
        </Pressable>
      </View>
      <Pressable onPress={() => onSelectItem?.(index)}>
        <View style={styles.costItemRow}>
          {item.costWorkItem ? (
            <Text>{`Cost Item: ${item.costWorkItem.label}`}</Text>
          ) : (
            <Text style={{ color: colors.angry500 }}>Cost Item: NOT SPECIFIED</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 5,
    gap: 5,
    width: '100%',
    borderRadius: 8, // Add this for better visual feedback
  },
  description: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  amountText: {
    width: 100,
    alignItems: 'flex-end',
  },
  taxText: {
    marginLeft: 4,
    width: 100,
  },
  totalText: {
    width: 100,
    alignItems: 'flex-end',
  },
  costItemRow: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 5,
  },
  costItemInput: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 5,
  },
  pickerButtonContainer: {
    paddingLeft: 10,
  },
});
