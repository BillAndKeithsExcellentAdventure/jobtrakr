import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput, TextInputProps, TextStyle } from 'react-native';
import { useColors } from '@/src/context/ColorsContext';

/**
 * Props for the {@link NumericInput} component.
 */
type NumericInputProps = {
  /** The controlled numeric value. Pass `null` to represent an empty field. */
  value: number | null;
  /**
   * Callback fired whenever the parsed numeric value changes.
   * Receives `null` when the field is empty or contains an incomplete expression
   * (e.g. `"-"` or `"1."`).
   */
  onChangeNumber: (value: number | null) => void;
  /**
   * Number of decimal places used to format the value on blur.
   * When omitted, no formatting is applied on blur.
   *
   * @example
   * // Displays "3.14" after the user leaves the field
   * <NumericInput value={3.14159} onChangeNumber={setValue} decimals={2} />
   */
  decimals?: number;
  /**
   * Maximum number of digits allowed after the decimal point.
   * Any input that would exceed this limit is silently rejected, keeping
   * the field at its current value.
   *
   * @example
   * // Accepts "3.14" but rejects a third decimal digit
   * <NumericInput value={price} onChangeNumber={setPrice} maxDecimals={2} />
   */
  maxDecimals?: number;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

/**
 * A controlled numeric text input that maintains a user-friendly editing
 * experience while keeping the parent's state in sync with a parsed `number`.
 *
 * Key behaviors:
 * - Only numeric characters, a single decimal point, and an optional leading
 *   minus sign are accepted; all other input is silently rejected.
 * - While the field is focused, the raw text typed by the user is preserved so
 *   that intermediate states such as `"1."` or `"-0"` are not clobbered by a
 *   prop update carrying the same numeric value.
 * - On blur, the displayed text is formatted to `decimals` places when that
 *   prop is provided.
 * - External value changes (i.e. a new `value` prop that differs from the
 *   current parsed text) are reflected in the displayed text even while the
 *   field is focused.
 * - When `maxDecimals` is set, any input that would add more decimal digits
 *   than the limit is silently dropped.
 * - Background and foreground text colors are taken from {@link useColors}
 *   so the field automatically adapts to light / dark mode.
 *
 * @example
 * const [qty, setQty] = useState<number | null>(null);
 * <NumericInput value={qty} onChangeNumber={setQty} decimals={2} maxDecimals={2} />
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChangeNumber,
  decimals,
  maxDecimals,
  ...props
}) => {
  const colors = useColors();
  const [text, setText] = useState(value !== null && value !== undefined ? String(value) : '');

  const [isFocused, setIsFocused] = useState(false);
  const lastPropValue = useRef<number | null>(value);

  // -------------------------
  // Sync external value -> text
  // -------------------------
  useEffect(() => {
    const valueChangedExternally = value !== lastPropValue.current;
    lastPropValue.current = value;

    // 🔑 CRITICAL RULE:
    // If focused AND numeric value matches,
    // do NOT override text (preserve "123.")
    if (isFocused) {
      if (value === parseFloat(text)) {
        return;
      }
    }

    if (value !== null && value !== undefined) {
      if (decimals !== undefined && value !== null) {
        const formatted = value.toFixed(decimals);
        setText(formatted);
      } else {
        setText(String(value));
      }
    } else {
      setText('');
    }
  }, [value, isFocused, text]);

  // -------------------------
  // Validation
  // -------------------------
  const isValidInput = (input: string) => {
    if (maxDecimals !== undefined) {
      return new RegExp(`^-?\\d*\\.?\\d{0,${maxDecimals}}$`).test(input);
    }
    return /^-?\d*\.?\d*$/.test(input);
  };

  // -------------------------
  // Handle typing
  // -------------------------
  const handleChangeText = useCallback(
    (input: string) => {
      if (!isValidInput(input)) return; // also enforces maxDecimals

      setText(input);

      const parsed = parseFloat(input);

      if (!isNaN(parsed)) {
        onChangeNumber(parsed); // 🔥 Parent always updated immediately
      } else {
        onChangeNumber(null);
      }
    },
    [onChangeNumber, maxDecimals],
  );

  // -------------------------
  // Handle blur formatting
  // -------------------------
  const handleBlur = () => {
    setIsFocused(false);

    if (decimals !== undefined && value !== null) {
      const formatted = value.toFixed(decimals);
      setText(formatted);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Default text style
  let txtStyle: TextStyle = { fontSize: 16, fontWeight: 'normal', lineHeight: 20, alignItems: 'center' };

  return (
    <TextInput
      {...props}
      value={text}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType="decimal-pad"
      style={[{ backgroundColor: colors.inputBackground, color: colors.text, ...txtStyle }, props.style]}
      placeholderTextColor={colors.placeHolder}
    />
  );
};
