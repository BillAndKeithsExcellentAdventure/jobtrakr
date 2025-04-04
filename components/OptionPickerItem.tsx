import { TextField } from '@/components/TextField';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
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
  onOptionLabelChange?: (label: string) => void;
  onPickerButtonPress: () => void;
  label?: string;
  placeholder?: string;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

export const OptionPickerItem: React.FC<OptionPickerItemProps> = ({
  optionLabel,
  onOptionLabelChange,
  onPickerButtonPress,
  label,
  placeholder,
  editable = true,
  containerStyle,
  inputStyle,
}) => {
  const iconColor = useThemeColor({ light: undefined, dark: undefined }, 'iconColor');
  const textDim = useThemeColor({ light: undefined, dark: undefined }, 'textDim');

  return (
    <View style={[styles.optionPickerRow, containerStyle]}>
      <View style={{ flex: 1 }}>
        <TextField
          style={inputStyle}
          label={label}
          placeholder={placeholder}
          placeholderTextColor={textDim}
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
    flexDirection: 'row',
  },
  pickerButtonContainer: {
    paddingLeft: 10,
  },
});
