import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DimensionValue, Keyboard, StyleProp, TextStyle, ViewStyle } from 'react-native';

interface OptionPickerProps {
  options: OptionEntry[];
  selectedOption?: OptionEntry;
  onOptionSelected: (option: OptionEntry) => void;
  label?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  textColor?: string;
  modalTitle?: string;
  modalHeight?: DimensionValue;
  centerOptions?: boolean;
  boldSelectedOption?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  initialSearchText?: string;
  showOkCancel?: boolean;
  okButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  showKeyboardToolbar?: boolean;
}

export const OptionPicker = ({
  options,
  selectedOption,
  onOptionSelected,
  label,
  placeholder = 'Select an option',
  style,
  inputStyle,
  textColor,
  modalTitle = 'Select Option',
  modalHeight = '75%',
  centerOptions = true,
  boldSelectedOption = true,
  enableSearch,
  searchPlaceholder,
  initialSearchText,
  showOkCancel,
  okButtonText,
  cancelButtonText,
  onCancel,
  showKeyboardToolbar = true,
}: OptionPickerProps) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const openPickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOptionSelect = useCallback(
    (option: OptionEntry) => {
      Keyboard.dismiss();
      onOptionSelected(option);
      setIsPickerVisible(false);
    },
    [onOptionSelected],
  );

  const toggleModalPicker = useCallback(() => {
    Keyboard.dismiss();
    if (openPickerTimeoutRef.current) {
      clearTimeout(openPickerTimeoutRef.current);
    }
    openPickerTimeoutRef.current = setTimeout(() => {
      setIsPickerVisible(true);
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (openPickerTimeoutRef.current) {
        clearTimeout(openPickerTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <OptionPickerItem
        containerStyle={style}
        inputStyle={inputStyle}
        textColor={textColor}
        optionLabel={selectedOption?.label}
        label={label}
        placeholder={placeholder}
        editable={false}
        onPickerButtonPress={toggleModalPicker}
      />

      <BottomSheetContainer
        isVisible={isPickerVisible}
        showKeyboardToolbar={showKeyboardToolbar}
        onClose={() => {
          Keyboard.dismiss();
          setIsPickerVisible(false);
        }}
        title={modalTitle}
        modalHeight={modalHeight}
      >
        <OptionList
          options={options}
          onSelect={handleOptionSelect}
          selectedOption={selectedOption}
          centerOptions={centerOptions}
          boldSelectedOption={boldSelectedOption}
          enableSearch={enableSearch ?? options.length > 15}
          searchPlaceholder={searchPlaceholder}
          initialSearchText={initialSearchText}
          showOkCancel={showOkCancel}
          okButtonText={okButtonText}
          cancelButtonText={cancelButtonText}
          onCancel={() => {
            onCancel?.();
            setIsPickerVisible(false);
          }}
        />
      </BottomSheetContainer>
    </>
  );
};
