import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { Text, TextInput } from './Themed';
import { ActionButton } from './ActionButton';
import { formatCurrency } from '@/src/utils/formatters';
import { useColors } from '@/src/context/ColorsContext';
import { Pressable } from 'react-native-gesture-handler';
import { ReceiptItem } from '@/src/models/types';

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
    <Pressable
      onPress={() => onSelectItem?.(index)}
      style={[
        styles.container,
        { borderColor: item.isSelected ? '#007AFF' : 'transparent', borderWidth: 1, margin: 2 }, // Add subtle highlight
      ]}
    >
      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountText}>Amt: {formatCurrency(item.amount, false, true)}</Text>
        {showTaxToggle && (
          <Switch
            style={{ zIndex: 10 }}
            value={item.taxable}
            onValueChange={() => {
              onTaxableChange(index);
            }}
          />
        )}
        <Text style={styles.taxText}>Tax: {formatCurrency(item.proratedTax, false, true)}</Text>
        <Text style={styles.totalText}>
          Total: {formatCurrency(item.amount + item.proratedTax, false, true)}
        </Text>
      </View>

      <View style={styles.costItemRow}>
        {item.costWorkItem ? (
          <Text>{`Cost Item: ${item.costWorkItem.label}`}</Text>
        ) : (
          <Text style={{ color: colors.angry500 }}>Cost Item: NOT SPECIFIED</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
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
