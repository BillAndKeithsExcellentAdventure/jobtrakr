import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Platform,
  Pressable,
  TextStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { ActionButton } from './ActionButton';
import { FlashList } from '@shopify/flash-list';

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
};

export default function OptionList({
  options,
  onSelect,
  textStyle,
  showOkCancel,
  onCancel,
  selectedOption,
}: Props) {
  const [isOkToSaveSelectedValue, setIsOkToSaveSelectedValue] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const colorScheme = useColorScheme();

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
    [onSelect],
  );

  useEffect(() => {
    if (options && selectedOption) {
      const match = options.find((o) => o.label === selectedOption.label);
      if (match) {
        if (showOkCancel) onOptionSelected(match);
        else setPickedOption(match);
      }
    }
  }, [selectedOption, options]);

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            iconColor: Colors.dark.iconColor,
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
          }
        : {
            background: Colors.light.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            iconColor: Colors.light.iconColor,
            borderColor: Colors.light.borderColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
          },
    [colorScheme],
  );

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
                style={{
                  width: '100%',
                  alignSelf: 'stretch',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderColor,
                  justifyContent: 'center',
                  height: 45,
                }}
                onPress={() => {
                  onOptionSelected(item);
                }}
              >
                <Text
                  text={item.label}
                  style={[
                    { fontWeight: 500 },
                    textStyle,
                    pickedOption && item.label === pickedOption.label && { fontSize: 20, fontWeight: 800 },
                  ]}
                />
              </Pressable>
            </View>
          )}
        />
      </View>
      {showOkCancel && (
        <View style={{ borderTopColor: colors.borderColor }}>
          <View style={[styles.saveButtonRow, { borderTopColor: colors.borderColor }]}>
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
