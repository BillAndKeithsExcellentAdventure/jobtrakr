import { OptionEntry } from '@/src/components/OptionList';
import { OptionPicker } from '@/src/components/OptionPicker';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { useCallback, useMemo } from 'react';
import { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

type CostItemPickerProps = {
  projectId: string;
  value?: string;
  onValueChange: (workItemId: string) => void;
  label?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  textColor?: string;
  modalTitle?: string;
  modalHeight?: DimensionValue;
  enableSearch?: boolean;
  showKeyboardToolbar?: boolean;
};

export const CostItemPicker = ({
  projectId,
  value,
  onValueChange,
  label = 'Cost Item Type',
  placeholder = 'Cost Item Type',
  style,
  inputStyle,
  textColor,
  modalTitle = 'Select Cost Item Type',
  modalHeight = '80%',
  enableSearch,
  showKeyboardToolbar = true,
}: CostItemPickerProps) => {
  const { allAvailableCostItemOptions } = useProjectWorkItems(projectId);

  const options = useMemo<OptionEntry[]>(() => allAvailableCostItemOptions, [allAvailableCostItemOptions]);

  const selectedOption = useMemo<OptionEntry | undefined>(() => {
    if (!value) {
      return undefined;
    }
    return options.find((option) => option.value === value);
  }, [value, options]);

  const handleOptionSelected = useCallback(
    (option: OptionEntry) => {
      onValueChange(String(option.value ?? ''));
    },
    [onValueChange],
  );

  return (
    <OptionPicker
      options={options}
      selectedOption={selectedOption}
      onOptionSelected={handleOptionSelected}
      label={label}
      placeholder={placeholder}
      style={style}
      inputStyle={inputStyle}
      textColor={textColor}
      modalTitle={modalTitle}
      modalHeight={modalHeight}
      centerOptions={false}
      boldSelectedOption={false}
      enableSearch={enableSearch}
      showKeyboardToolbar={showKeyboardToolbar}
    />
  );
};
