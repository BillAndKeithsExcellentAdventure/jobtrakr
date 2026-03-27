import { OptionEntry } from '@/src/components/OptionList';
import { OptionPicker } from '@/src/components/OptionPicker';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { useCallback, useEffect, useState } from 'react';
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

  // Keep options and selected option state internal to this wrapper.
  const [options, setOptions] = useState<OptionEntry[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionEntry | undefined>(undefined);

  useEffect(() => {
    setOptions(allAvailableCostItemOptions);
  }, [allAvailableCostItemOptions]);

  useEffect(() => {
    if (!value) {
      setSelectedOption(undefined);
      return;
    }

    const matchedOption = options.find((option) => option.value === value);
    setSelectedOption(matchedOption);
  }, [value, options]);

  const handleOptionSelected = useCallback(
    (option: OptionEntry) => {
      setSelectedOption(option);
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
