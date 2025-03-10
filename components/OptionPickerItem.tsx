import { TextField } from '@/components/TextField';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { useThemeColor, View } from './Themed';

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
