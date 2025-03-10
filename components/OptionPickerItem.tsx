import { TextField } from '@/components/TextField';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { useThemeColor, View } from './Themed';

/* -------------------------------------------
 Standard Supporting React State 
 -------------------------------------------
  const [isListPickerVisible, setIsListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const [pickedOptionLabel, setPickedOptionLabel] = useState<string | undefined>(undefined);
  const onOptionSelected = (option: OptionEntry) => {
    setPickedOption(option);
    if (option) {
      setPickedOptionLabel(option.label);
    }
    setIsListPickerVisible(false);
  };

  const optionLabelChanged = useCallback((optionLabel: string) => {
    const match = pickerOptions.find((o) => o.label === optionLabel);
    setPickedOptionLabel(optionLabel);
    setPickedOption(match);
  }, []);
  -------------------------------------------------------
  Example OptionPickerItem JSX
  -------------------------------------------------------
    <OptionPickerItem
        optionLabel={pickedOptionLabel}
        label="My Option"
        placeholder="Define Option"
        onOptionLabelChange={optionLabelChanged}
        onPickerButtonPress={() => setIsListPickerVisible(true)}
    />
  -------------------------------------------------------
  Supporting Modal OptionList and BottomSheetContainer JSX
  -------------------------------------------------------
      {isListPickerVisible && (
        <BottomSheetContainer isVisible={isListPickerVisible} onClose={() => setIsListPickerVisible(false)}>
          <OptionList
            options={pickerOptions}
            onSelect={(option) => onOptionSelected(option)}
            selectedOption={pickedOption}
          />
        </BottomSheetContainer>
      )}
  ----------------------------------------------*/

interface OptionPickerItemProps {
  optionLabel?: string;
  onOptionLabelChange: (label: string) => void;
  onPickerButtonPress: () => void;
  label?: string;
  placeholder?: string;
  editable?: boolean;
}

export const OptionPickerItem: React.FC<OptionPickerItemProps> = ({
  optionLabel,
  onOptionLabelChange,
  onPickerButtonPress,
  label,
  placeholder,
  editable = true,
}) => {
  const iconColor = useThemeColor({ light: undefined, dark: undefined }, 'iconColor');

  return (
    <View style={styles.optionPickerRow}>
      <View style={{ flex: 1 }}>
        <TextField
          label={label}
          placeholder={placeholder}
          onChangeText={onOptionLabelChange}
          value={optionLabel}
          editable
        />
      </View>
      <Pressable style={{ justifyContent: 'flex-end' }} onPress={onPickerButtonPress}>
        <View style={[styles.pickerButtonContainer]}>
          <Ionicons name="ellipsis-horizontal-circle" size={36} color={iconColor} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  optionPickerRow: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  pickerButtonContainer: {
    paddingLeft: 10,
  },
});
