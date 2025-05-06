import { Text, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, StyleProp, StyleSheet, TextStyle } from 'react-native';
import { ActionButton } from './ActionButton';

// Define types for the props
export interface OptionEntry {
  label: string;
  value?: any;
}

type Props = {
  options: OptionEntry[];
  onSelect: (option: OptionEntry) => void;
  textStyle?: StyleProp<TextStyle>;
  showOkCancel?: boolean;
  onCancel?: () => void;
  selectedOption?: OptionEntry;
  centerOptions?: boolean;
  boldSelectedOption?: boolean;
};

export default function OptionList({
  options,
  onSelect,
  textStyle,
  showOkCancel,
  onCancel,
  selectedOption,
  centerOptions = true,
  boldSelectedOption = true,
}: Props) {
  const [isOkToSaveSelectedValue, setIsOkToSaveSelectedValue] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);

  const onOkSelected = useCallback(() => {
    if (pickedOption) onSelect(pickedOption);
  }, [pickedOption, onSelect]);

  const onOptionSelected = useCallback(
    (item: OptionEntry) => {
      setPickedOption(item);
      if (showOkCancel) {
        setIsOkToSaveSelectedValue(!!item);
      } else {
        onSelect(item);
      }
    },
    [showOkCancel, onSelect],
  );

  useEffect(() => {
    if (options && selectedOption) {
      const match = options.find((o) => o.label === selectedOption.label);
      if (match) {
        if (showOkCancel) onOptionSelected(match);
        else setPickedOption(match);
      }
    }
  }, [selectedOption, options, showOkCancel, onOptionSelected]);

  const colors = useColors();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FlatList
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          data={options}
          renderItem={({ item, index }) => (
            <View>
              <Pressable
                key={index}
                style={[
                  {
                    width: '100%',
                    paddingHorizontal: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    justifyContent: 'center',
                    height: 45,
                  },
                  centerOptions && { alignItems: 'center' },
                ]}
                onPress={() => {
                  onOptionSelected(item);
                }}
              >
                <Text
                  text={item.label}
                  style={[
                    { fontWeight: 500 },
                    textStyle,
                    pickedOption &&
                      boldSelectedOption &&
                      item.label === pickedOption.label && { fontSize: 18, fontWeight: 800 },
                  ]}
                />
              </Pressable>
            </View>
          )}
        />
      </View>
      {showOkCancel && (
        <View style={{ borderTopColor: colors.border }}>
          <View style={[styles.saveButtonRow, { borderTopColor: colors.border }]}>
            <ActionButton
              style={styles.saveButton}
              onPress={onOkSelected}
              type={isOkToSaveSelectedValue ? 'ok' : 'disabled'}
              title="Save"
            />
            <ActionButton
              style={styles.cancelButton}
              onPress={() => onCancel && onCancel()}
              type={'cancel'}
              title="Cancel"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: 'white',
  },
  saveButtonRow: {
    paddingHorizontal: 10,
    borderTopWidth: 2,
    marginTop: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});
