import { TextField } from '@/src/components/TextField';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleProp, StyleSheet, ViewStyle, Keyboard, TextInput } from 'react-native';
import { useThemeColor, View } from './Themed';
import { Pressable } from 'react-native-gesture-handler';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
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

export type OptionPickerItemHandle = {
  blur: () => void;
};

export const OptionPickerItem = forwardRef<OptionPickerItemHandle, OptionPickerItemProps>(
  (
    {
      optionLabel,
      onOptionLabelChange,
      onPickerButtonPress,
      label,
      placeholder,
      editable = true,
      containerStyle,
      inputStyle,
    },
    ref,
  ) => {
    const inputRef = useRef<TextInput | null>(null);

    const [labelText, setLabelText] = useState<string | undefined>();

    useEffect(() => {
      setLabelText(optionLabel);
    }, [optionLabel]);

    // Store the current label text in a ref for stable access in callbacks
    const labelTextRef = useRef<string>(labelText ?? '');
    labelTextRef.current = labelText ?? '';

    const handleOnBlur = useCallback(() => {
      //console.log('OptionPickerItem handleOnBlur called');
      onOptionLabelChange?.(labelText ?? '');
    }, [onOptionLabelChange, labelText]);

    useImperativeHandle(ref, () => ({
      blur: () => {
        handleOnBlur();
      },
    }));

    const iconColor = useThemeColor({ light: undefined, dark: undefined }, 'iconColor');
    const textDim = useThemeColor({ light: undefined, dark: undefined }, 'textDim');
    const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

    const blurAndOpen = () => {
      const focused = TextInput.State?.currentlyFocusedInput ? TextInput.State.currentlyFocusedInput() : null;
      if (focused && TextInput.State?.blurTextInput) {
        TextInput.State.blurTextInput(focused);
      } else {
        Keyboard.dismiss();
      }
      onPickerButtonPress();
    };

    if (!editable) {
      return (
        <Pressable onPress={blurAndOpen}>
          <View style={[styles.optionPickerRow, containerStyle]}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <TextField
                style={[inputStyle, { color: text }]}
                label={label}
                placeholder={placeholder}
                placeholderTextColor={textDim}
                value={labelText}
                editable={editable}
              />
            </View>
            <View
              style={[
                styles.pickerButtonContainer,
                { justifyContent: 'flex-end', backgroundColor: 'transparent' },
              ]}
            >
              <Ionicons name="ellipsis-horizontal-circle" size={36} color={iconColor} />
            </View>
          </View>
        </Pressable>
      );
    }

    return (
      <View style={[styles.optionPickerRow, containerStyle]}>
        <View style={{ flex: 1 }}>
          <TextField
            ref={inputRef}
            style={inputStyle}
            label={label}
            placeholder={placeholder}
            placeholderTextColor={textDim}
            onChangeText={setLabelText}
            onBlur={handleOnBlur}
            value={labelText}
            editable={editable}
          />
        </View>
        <Pressable onPress={blurAndOpen} style={{ justifyContent: 'flex-end' }}>
          <View style={styles.pickerButtonContainer}>
            <Ionicons name="ellipsis-horizontal-circle" size={36} color={iconColor} />
          </View>
        </Pressable>
      </View>
    );
  },
);
OptionPickerItem.displayName = 'OptionPickerItem';

const styles = StyleSheet.create({
  optionPickerRow: {
    width: '100%',
    flexDirection: 'row',
  },
  pickerButtonContainer: {
    paddingLeft: 10,
  },
});
