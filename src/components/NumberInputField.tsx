import { useColors } from '@/src/context/ColorsContext';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useId,
  useContext,
} from 'react';
import { StyleSheet, TextInput, ViewStyle } from 'react-native';
import { Text, View } from './Themed';
import { FocusManagerContext } from '@/src/hooks/useFocusManager';

interface NumberInputFieldProps {
  value: number;
  numDecimalPlaces?: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  style?: ViewStyle;
  /**
   * Optional custom ID for FocusManager registration.
   * When provided, the field's current value can be retrieved via
   * focusManager.getFieldValue(focusManagerId) without waiting for blur.
   */
  focusManagerId?: string;
  /**
   * When true, the input will be focused and all text will be selected on mount.
   */
  autoFocus?: boolean;
}

// handle exposed to parent via ref
export type NumberInputFieldHandle = {
  blur: () => void;
  focus?: () => void;
  getValue: () => number;
};

export const NumberInputField = forwardRef<NumberInputFieldHandle, NumberInputFieldProps>(
  (
    {
      value,
      numDecimalPlaces = 2, // Default to 2 decimal places
      onChange,
      label,
      placeholder = 'Enter number',
      readOnly = false,
      style = {},
      focusManagerId,
      autoFocus = false,
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState(value ? value.toFixed(numDecimalPlaces) : '0.00');
    const inputRef = useRef<TextInput | null>(null);
    const isEditingRef = useRef(false);
    const autoFieldId = useId();
    // Use custom focusManagerId if provided, otherwise use auto-generated ID
    const fieldId = focusManagerId ?? autoFieldId;

    // Try to get FocusManager context, but don't require it
    const focusManager = useContext(FocusManagerContext);

    const handleBlurInternal = useCallback(() => {
      // console.log('NumberInputField: handleBlur called with inputValue:', inputValue);
      isEditingRef.current = false;
      const numericValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericValue)) {
        setInputValue(numericValue.toFixed(numDecimalPlaces));
        onChange(numericValue);
      } else {
        const zero = 0;
        setInputValue(zero.toFixed(numDecimalPlaces));
        onChange(0);
      }
    }, [onChange, inputValue, numDecimalPlaces]);

    // Store the current input value in a ref for stable access in callbacks
    const inputValueRef = useRef(inputValue);
    inputValueRef.current = inputValue;

    const getValueFromInput = useCallback(() => {
      const numericValue = parseFloat(inputValueRef.current.replace(/[^0-9.]/g, ''));
      isEditingRef.current = false;

      return isNaN(numericValue) ? 0 : numericValue;
    }, []);

    useImperativeHandle(ref, () => ({
      blur: () => {
        inputRef.current?.blur();
      },
      focus: () => {
        inputRef.current?.focus();
      },
      getValue: getValueFromInput,
      selectAll: () => {
        if (inputRef.current) {
          const textLength = inputValueRef.current.length;
          try {
            inputRef.current.setSelection && inputRef.current.setSelection(0, textLength);
          } catch {
            // ignore if method not available
          }
        }
      },
    }));

    // Register with FocusManager - includes getCurrentValue callback for accessing input value
    // without waiting for blur events
    useEffect(() => {
      if (focusManager) {
        focusManager.registerField(
          fieldId,
          () => {
            // Call handleBlurInternal directly to ensure blur logic executes
            // Calling inputRef.current?.blur() doesn't reliably trigger onBlur in React Native
            handleBlurInternal();
            inputRef.current?.blur();
          },
          getValueFromInput,
        );
        return () => {
          focusManager.unregisterField(fieldId);
        };
      }
    }, [fieldId, focusManager, handleBlurInternal, getValueFromInput]);

    useEffect(() => {
      console.log('NumberInputField: value prop changed to ', value);
      if (undefined === value || null === value) return;
      const strValue = value.toFixed(numDecimalPlaces);
      setInputValue(strValue);
      const textLength = strValue.length;
      try {
        if (inputRef.current) inputRef.current.setSelection(0, textLength);
      } catch {}
    }, [value, numDecimalPlaces]);

    // Auto-focus and select all text on mount when autoFocus is true
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        // Use requestAnimationFrame to ensure the input is fully mounted and laid out
        const frameId = requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const textLength = inputValueRef.current.length;
            try {
              inputRef.current.setSelection(0, textLength);
            } catch {}
          }
        });
        return () => cancelAnimationFrame(frameId);
      }
    }, [autoFocus]);

    useEffect(() => {
      if (isEditingRef.current) return;
      const textLength = inputValue.length;
      try {
        if (inputRef.current) inputRef.current.setSelection(0, textLength);
      } catch {}
    }, [inputValue]);

    const handleInputChange = (text: string) => {
      if (readOnly) return; // Prevent changes if readOnly is true
      isEditingRef.current = true;
      // Remove any non-numeric characters except for the decimal point
      const sanitizedValue = text.replace(/[^0-9.]/g, '');

      // Make sure we don't allow more decimal places than specified
      const parts = sanitizedValue.split('.');
      if (parts.length > 1 && parts[1].length > numDecimalPlaces) {
        return; // Don't update input if decimal places exceed the limit
      }

      // If the number is valid, update the input value
      setInputValue(sanitizedValue);
    };

    const handleBlur = useCallback(() => {
      handleBlurInternal();
    }, [handleBlurInternal]);

    const colors = useColors();

    const handleFocus = useCallback(
      (event: any) => {
        if (inputRef.current) {
          const textLength = inputValue.length;
          try {
            inputRef.current.setSelection && inputRef.current.setSelection(0, textLength);
          } catch {
            // ignore if method not available
          }
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
            ref={(r) => {
              inputRef.current = r;
            }}
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
  },
);

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
  label: { marginBottom: 4 },
  input: {
    alignSelf: 'stretch',
    fontSize: 16,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginHorizontal: 10,
  },
});
