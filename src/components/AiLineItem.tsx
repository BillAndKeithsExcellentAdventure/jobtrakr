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
  currentProjectId: string;
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
  currentProjectId,
}) => {
  const colors = useColors();
  const textColor = item.costWorkItem?.projectId
    ? item.costWorkItem?.projectId === currentProjectId
      ? colors.text
      : colors.textMuted
    : colors.text; // Use muted color if not associated with the current project
  return (
    <View
      style={[
        styles.container,
        { borderColor: item.isSelected ? '#007AFF' : colors.border, borderWidth: 1, margin: 2 }, // Add subtle highlight
      ]}
    >
      <Pressable onPress={() => onSelectItem?.(index)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ ...styles.description, color: textColor }}>{item.description}</Text>
          <Text style={{ ...styles.amountText, color: textColor }}>
            Amt: {formatCurrency(item.amount, false, true)}
          </Text>
        </View>
      </Pressable>
      <View style={styles.amountRow}>
        {showTaxToggle && (
          <Switch
            value={item.taxable}
            onValueChange={() => {
              onTaxableChange(index);
            }}
          />
        )}
        <Pressable style={{ flex: 1 }} onPress={() => onSelectItem?.(index)}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ ...styles.taxText, color: textColor }}>
              Tax: {formatCurrency(item.proratedTax, false, true)}
            </Text>
            <Text style={{ ...styles.totalText, color: textColor }}>
              Total: {formatCurrency(item.amount + item.proratedTax, false, true)}
            </Text>
          </View>
        </Pressable>
      </View>
      <Pressable onPress={() => onSelectItem?.(index)}>
        <View style={styles.costItemRow}>
          {item.costWorkItem ? (
            <Text style={{ color: textColor }}>{`Cost Item: ${item.costWorkItem.label}`}</Text>
          ) : (
            <Text style={{ color: colors.angry500 }}>No Cost Item specified.</Text>
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
    overflow: 'hidden',
  },
  amountRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  amountText: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  taxText: {
    marginLeft: 5,
    flex: 1,
    textAlign: 'left',
  },
  totalText: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  costItemRow: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 5,
  },
  pickerButtonContainer: {
    paddingLeft: 10,
  },
});
