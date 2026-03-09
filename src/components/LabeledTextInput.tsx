import React, { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Text, TextProps, View } from './Themed';
import { useColors } from '../context/ColorsContext';

/** Imperative handle exposed via `ref` on {@link LabeledTextInput}. */
export type LabeledTextInputHandle = RNTextInput;

/**
 * Props for the {@link LabeledTextInput} component.
 */
export type LabeledTextInputProps = {
  /**
   * Optional label rendered above the input using the themed {@link Text} component.
   * When omitted, no label is displayed.
   */
  label?: string;
  /**
   * Override the label's text size. Defaults to `'xxs'`.
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
   * Additional styles merged into the {@link TextInput} element.
   * Applied after the default input styles, so any property set here
   * will override the built-in `borderWidth`, `borderRadius`, and padding.
   *
   * @example
   * // Make the input full-width with a custom border color
   * <LabeledTextInput inputStyle={{ flex: 1, borderColor: 'blue' }} … />
   */
  inputStyle?: TextStyle;
} & TextInputProps;

/**
 * A labelled text input field with automatic theming.
 *
 * - Renders an optional themed label above the input.
 * - The label defaults to `txtSize='xxs'` and can be fully customized via
 *   `labelTxtSize` and `labelStyle`.
 * - The outer container style can be overridden via `containerStyle`.
 * - The inner input style can be overridden via `inputStyle`.
 * - Supports forwarding refs to the underlying React Native TextInput.
 * - All other props are forwarded to the underlying TextInput.
 *
 * @example
 * const [name, setName] = useState('');
 *
 * <LabeledTextInput
 *   label="Project Name"
 *   value={name}
 *   onChangeText={setName}
 *   placeholder="Enter project name"
 * />
 */
export const LabeledTextInput = forwardRef<LabeledTextInputHandle, LabeledTextInputProps>(
  function LabeledTextInput(
    { label, labelTxtSize = 'xxs', labelStyle, containerStyle, inputStyle, style, ...inputProps },
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
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.neutral200,
              borderColor: colors.border,
            },
            inputStyle,
            style,
          ]}
          placeholderTextColor={colors.placeHolder}
          {...inputProps}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 4,
    backgroundColor: 'transparent',
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
