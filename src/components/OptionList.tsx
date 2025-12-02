import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleProp, StyleSheet, TextInput, TextStyle } from 'react-native';
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
  enableSearch?: boolean;
  searchPlaceholder?: string;
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
  enableSearch = true,
  searchPlaceholder = 'Search...',
}: Props) {
  const [isOkToSaveSelectedValue, setIsOkToSaveSelectedValue] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const [searchText, setSearchText] = useState<string>('');

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

  // Filter options based on search text
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) {
      return options;
    }
    const searchLower = searchText.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(searchLower));
  }, [options, searchText]);

  const colors = useColors();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {enableSearch && (
          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
        <FlatList
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          data={filteredOptions}
          keyExtractor={(item, index) => `${item.label}-${index}`}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text text="No options found" style={{ color: colors.textSecondary }} />
            </View>
          }
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
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
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
