import React, { forwardRef } from 'react';
import { StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Text, TextProps, View } from './Themed';
import { NumericInput, NumericInputHandle } from './NumericInput';
import { useColors } from '../context/ColorsContext';

/** Imperative handle exposed via `ref` on {@link NumericInputField}. */
export type NumericInputFieldHandle = NumericInputHandle;

/**
 * Props for the {@link NumericInputField} component.
 */
export type NumericInputFieldProps = {
  /** The controlled numeric value. Pass `null` to represent an empty field. */
  value: number | null;
  /**
   * Callback fired whenever the parsed numeric value changes.
   * Receives `null` when the field is empty or contains an incomplete expression.
   */
  onChangeNumber: (value: number | null) => void;
  /**
   * Optional label rendered above the input using the themed {@link Text} component.
   * When omitted, no label is displayed.
   */
  label?: string;
  /**
   * Override the label's text size. Defaults to `'xs'`.
   * Accepts any value supported by the themed `Text` component's `txtSize` prop.
   */
  labelTxtSize?: TextProps['txtSize'];
  /**
   * Additional styles merged into the label `Text` element.
   * Useful for adjusting color, margin, etc.
   */
  labelStyle?: TextStyle;
  /**
   * Additional styles merged into the outer container `View`.
   * Use this to control width, margin, padding, etc.
   */
  containerStyle?: ViewStyle;
  /**
   * Additional styles merged into the {@link NumericInput} element.
   * Applied after the default input styles, so any property set here
   * will override the built-in `borderWidth`, `borderRadius`, and padding.
   *
   * @example
   * // Make the input full-width with a custom border color
   * <NumericInputField inputStyle={{ flex: 1, borderColor: 'blue' }} … />
   */
  inputStyle?: TextStyle;
  /**
   * Number of decimal places used to format the value on blur.
   * When omitted, no formatting is applied on blur.
   */
  decimals?: number;
  /**
   * Maximum number of digits allowed after the decimal point.
   * Any input that would exceed this limit is silently rejected.
   */
  maxDecimals?: number;
  /**
   * When `true`, all text in the field is automatically selected when the input
   * receives focus, making it easy for the user to overwrite the current value.
   *
   * @default true
   */
  selectOnFocus?: boolean;
  /**
   * Optional identifier for the item currently represented by this input.
   * When this value changes, all text is automatically selected.
   * See {@link NumericInput} `itemId` for full details.
   */
  itemId?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

/**
 * A labelled numeric input field that composes {@link NumericInput} inside a
 * themed container view.
 *
 * - Renders an optional themed label above the input.
 * - The label defaults to `txtSize='xs'` and can be fully customized via
 *   `labelTxtSize` and `labelStyle`.
 * - The outer container style can be overridden via `containerStyle`.
 * - The inner input style can be overridden via `inputStyle`.
 * - All other props are forwarded to the underlying {@link NumericInput}.
 *
 * @example
 * const [price, setPrice] = useState<number | null>(null);
 *
 * <NumericInputField
 *   label="Unit Price"
 *   value={price}
 *   onChangeNumber={setPrice}
 *   decimals={2}
 *   maxDecimals={2}
 *   placeholder="0.00"
 * />
 */
export const NumericInputField = forwardRef<NumericInputFieldHandle, NumericInputFieldProps>(
  function NumericInputField(
    {
      label,
      labelTxtSize = 'xxs',
      labelStyle,
      containerStyle,
      inputStyle,
      value,
      onChangeNumber,
      decimals,
      maxDecimals,
      selectOnFocus = false,
      itemId,
      style,
      ...inputProps
    },
    ref,
  ) {
    const colors = useColors();
    return (
      <View style={[styles.container, containerStyle]}>
        {label !== undefined && label !== '' && (
          <Text txtSize={labelTxtSize} style={[styles.label, labelStyle]}>
            {label}
          </Text>
        )}
        <NumericInput
          ref={ref}
          value={value}
          onChangeNumber={onChangeNumber}
          decimals={decimals}
          maxDecimals={maxDecimals}
          selectOnFocus={selectOnFocus}
          itemId={itemId}
          style={[
            styles.input,
            { backgroundColor: colors.neutral200, borderColor: colors.neutral400 },
            inputStyle,
            style,
          ]}
          {...inputProps}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    // intentionally minimal – callers override via labelStyle
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
