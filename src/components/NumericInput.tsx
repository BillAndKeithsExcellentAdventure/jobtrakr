import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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
  /**
   * When `true`, all text in the field is automatically selected when the input
   * receives focus, making it easy for the user to overwrite the current value.
   *
   * @default false
   */
  selectOnFocus?: boolean;
  /**
   * Optional identifier for the item currently represented by this input.
   * When this value changes, all text is automatically selected so the user
   * can immediately overwrite the value for the new item.
   * Useful when a single input navigates between list rows that may share the
   * same numeric value (preventing the value-sync effect from firing).
   */
  itemId?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

/**
 * Imperative handle exposed via `ref` on {@link NumericInput} and
 * {@link NumericInputField}.
 */
export type NumericInputHandle = {
  /**
   * Programmatically focus the input.
   * Pass `true` to also select all text after focusing.
   */
  focus: (selectAll?: boolean) => void;
  /** Programmatically blur the input. */
  blur: () => void;
  /** Select all text currently displayed in the input. */
  selectAll: () => void;
};

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
export const NumericInput = forwardRef<NumericInputHandle, NumericInputProps>(function NumericInput(
  { value, onChangeNumber, decimals, maxDecimals, selectOnFocus = false, itemId, ...props },
  ref,
) {
  const colors = useColors();
  const [text, setText] = useState(value !== null && value !== undefined ? String(value) : '');
  const textRef = useRef(text);
  textRef.current = text;
  const inputRef = useRef<TextInput | null>(null);

  const isFocusedRef = useRef(false);
  const lastPropValue = useRef<number | null>(value);
  const prevItemId = useRef<string | undefined>(itemId);

  // When itemId changes (but not on initial mount), mark selection as pending.
  // The actual setSelection is deferred to the text-change effect below so it
  // runs only after the new text has been committed to the input.
  useEffect(() => {
    if (prevItemId.current === itemId || !selectOnFocus) return;
    prevItemId.current = itemId;
    const frameId = requestAnimationFrame(() => {
      try {
        inputRef.current?.setSelection(0, textRef.current.length);
      } catch {}
    });
    return () => cancelAnimationFrame(frameId);
  }, [itemId, selectOnFocus]);

  // Apply pending select-all after the text state (and therefore the input's
  // displayed value) has been updated.
  useEffect(() => {
    if (!selectOnFocus) return;
    const frameId = requestAnimationFrame(() => {
      try {
        inputRef.current?.setSelection(0, textRef.current.length);
      } catch {}
    });
    return () => cancelAnimationFrame(frameId);
  }, [text, selectOnFocus]);

  useImperativeHandle(ref, () => ({
    focus: (selectAll?: boolean) => {
      inputRef.current?.focus();
      if (selectAll) {
        requestAnimationFrame(() => {
          try {
            inputRef.current?.setSelection(0, textRef.current.length);
          } catch {}
        });
      }
    },
    blur: () => inputRef.current?.blur(),
    selectAll: () => {
      try {
        inputRef.current?.setSelection(0, textRef.current.length);
      } catch {}
    },
  }));

  // -------------------------
  // Sync external value -> text
  // -------------------------
  useEffect(() => {
    lastPropValue.current = value;

    // 🔑 CRITICAL RULE:
    // If focused AND numeric value matches,
    // do NOT override text (preserve "123.")
    if (isFocusedRef.current) {
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
  }, [value, text]);

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
    isFocusedRef.current = false;

    if (decimals !== undefined && value !== null) {
      const formatted = value.toFixed(decimals);
      setText(formatted);
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    if (selectOnFocus && inputRef.current) {
      const frameId = requestAnimationFrame(() => {
        try {
          inputRef.current?.setSelection(0, textRef.current.length);
        } catch {}
      });
      return () => cancelAnimationFrame(frameId);
    }
  };

  // Default text style
  let txtStyle: TextStyle = { fontSize: 16, fontWeight: 'normal', lineHeight: 20, alignItems: 'center' };

  return (
    <TextInput
      {...props}
      ref={inputRef}
      value={text}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType="decimal-pad"
      style={[{ backgroundColor: colors.inputBackground, color: colors.text, ...txtStyle }, props.style]}
      placeholderTextColor={colors.placeHolder}
    />
  );
});
