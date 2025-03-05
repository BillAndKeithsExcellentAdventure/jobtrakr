import { Colors } from '@/constants/Colors';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, ViewStyle } from 'react-native';
import { Text, View } from './Themed';
import { useColorScheme } from './useColorScheme';

interface NumberInputFieldProps {
  value: number;
  numDecimalPlaces?: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  style?: ViewStyle;
}

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  value,
  numDecimalPlaces = 2, // Default to 2 decimal places
  onChange,
  label,
  placeholder = 'Enter number',
  readOnly = false,
  style = {},
}) => {
  const zero = 0;

  const [inputValue, setInputValue] = useState(
    value ? value.toFixed(numDecimalPlaces) : zero.toFixed(numDecimalPlaces),
  );
  const colorScheme = useColorScheme();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setInputValue(value ? value.toFixed(numDecimalPlaces) : zero.toFixed(numDecimalPlaces)); // Reset input value if the prop changes
  }, [value, numDecimalPlaces]);

  const handleInputChange = (text: string) => {
    if (readOnly) return; // Prevent changes if readOnly is true

    // Remove any non-numeric characters except for the decimal point
    const sanitizedValue = text.replace(/[^0-9.]/g, '');

    // Make sure we don't allow more decimal places than specified
    const parts = sanitizedValue.split('.');
    if (parts.length > 1 && parts[1].length > numDecimalPlaces) {
      return; // Don't update input if decimal places exceed the limit
    }

    // If the number is valid, update the input value
    setInputValue(sanitizedValue);

    // Convert to number and ensure it's not less than zero
    const numericValue = Math.max(0, parseFloat(sanitizedValue || '0'));
    onChange(numericValue);
  };

  const handleBlur = useCallback(() => {
    const numericValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericValue)) {
      setInputValue(numericValue.toFixed(numDecimalPlaces));
      onChange(numericValue);
    } else {
      const zero = 0;
      setInputValue(zero.toFixed(numDecimalPlaces));
      onChange(0);
    }
  }, [onChange, inputValue]);

  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            error: Colors.dark.error,
            textDim: Colors.dark.textDim,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            neutral400: Colors.dark.neutral400,
            text: Colors.dark.text,
          }
        : {
            error: Colors.light.error,
            textDim: Colors.light.textDim,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            neutral400: Colors.light.neutral400,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const handleFocus = useCallback(
    (event: any) => {
      if (inputRef.current) {
        const textLength = inputValue.length;
        inputRef.current.setSelection(0, textLength);
      }
    },
    [inputRef, inputValue],
  );

  return (
    <View style={[styles.container, style]}>
      {!!label && <Text txtSize="formLabel" text={label} style={styles.label} />}
      <View
        style={[
          style,
          {
            backgroundColor: colors.neutral200,
            borderColor: colors.neutral400,
          },
          styles.inputContainer,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            readOnly && { color: colors.textDim },
          ]}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          keyboardType="numeric"
          editable={!readOnly}
          onBlur={handleBlur}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    height: 36,
    paddingEnd: 8,
  },
  label: { marginBottom: -2 },
  input: {
    alignSelf: 'stretch',
    fontSize: 16,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginHorizontal: 10,
  },
});
