import { useColors } from '@/src/context/ColorsContext';
import {
  ComponentType,
  forwardRef,
  Ref,
  useImperativeHandle,
  useRef,
  useId,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Text, TextProps, View } from './Themed';
import { FocusManagerContext } from '@/src/hooks/useFocusManager';

export interface TextFieldAccessoryProps {
  style: StyleProp<ViewStyle | TextStyle | ImageStyle>;
  status: TextFieldProps['status'];
  multiline: boolean;
  editable: boolean;
}

export interface TextFieldProps extends Omit<TextInputProps, 'ref'> {
  /**
   * A style modifier for different input states.
   */
  status?: 'error' | 'disabled';
  /**
   * The label text to display above input.
   */
  label?: string;
  /**
   * Pass any additional props directly to the label Text component.
   */
  LabelTextProps?: TextProps;
  /**
   * The helper text to display below input.
   */
  helper?: string;
  /**
   * Pass any additional props directly to the helper Text component.
   */
  HelperTextProps?: TextProps;
  /**
   * The placeholder text to display if not using `placeholderTx`.
   */
  placeholder?: TextInputProps['placeholder'];
  /**
   * Optional placeholder options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  style?: any;
  /**
   * Style overrides for the container
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Style overrides for the input wrapper
   */
  inputWrapperStyle?: StyleProp<ViewStyle>;
  /**
   * An optional component to render on the right side of the input.
   * Example: `RightAccessory={(props) => <Icon icon="ladybug" containerStyle={props.style} color={props.editable ? colors.textDim : colors.text} />}`
   * Note: It is a good idea to memoize this.
   */
  RightAccessory?: ComponentType<TextFieldAccessoryProps>;
  /**
   * An optional component to render on the left side of the input.
   * Example: `LeftAccessory={(props) => <Icon icon="ladybug" containerStyle={props.style} color={props.editable ? colors.textDim : colors.text} />}`
   * Note: It is a good idea to memoize this.
   */
  LeftAccessory?: ComponentType<TextFieldAccessoryProps>;
  /**
   * Optional custom ID for FocusManager registration.
   * When provided, the field's current value can be retrieved via
   * focusManager.getFieldValue(focusManagerId) without waiting for blur.
   */
  focusManagerId?: string;
}

/**
 * A component that allows for the entering and editing of text.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/TextField/}
 * @param {TextFieldProps} props - The props for the `TextField` component.
 * @returns {JSX.Element} The rendered `TextField` component.
 */
export const TextField = forwardRef(function TextField(props: TextFieldProps, ref: Ref<TextInput>) {
  const {
    label,
    placeholder,
    helper,
    status,
    RightAccessory,
    LeftAccessory,
    HelperTextProps,
    LabelTextProps,
    style: $inputStyleOverride,
    containerStyle: $containerStyleOverride,
    inputWrapperStyle: $inputWrapperStyleOverride,
    focusManagerId,
    ...TextInputProps
  } = props;
  const input = useRef<TextInput>(null);
  const autoFieldId = useId();
  // Use custom focusManagerId if provided, otherwise use auto-generated ID
  const fieldId = focusManagerId ?? autoFieldId;

  // Try to get FocusManager context, but don't require it
  const focusManager = useContext(FocusManagerContext);

  const disabled = TextInputProps.editable === false || status === 'disabled';

  // Store the current input value in a ref for stable access in callbacks
  const inputValueRef = useRef<string>(typeof TextInputProps.value === 'string' ? TextInputProps.value : '');
  // Update the ref whenever value changes
  if (typeof TextInputProps.value === 'string') {
    inputValueRef.current = TextInputProps.value;
  }

  const getValueFromInput = useCallback(() => {
    return inputValueRef.current;
  }, []);

  const placeholderContent = placeholder;

  const $containerStyles = [$containerStyleOverride];

  const $labelStyles = [styles.labelStyle, LabelTextProps?.style];

  const colors = useColors();
  const $inputWrapperStyles = [
    {
      backgroundColor: colors.neutral200,
      borderColor: colors.neutral400,
    },
    styles.inputWrapperStyle,
    status === 'error' && { borderColor: colors.error },
    TextInputProps.multiline && { minHeight: 60 },
    { paddingStart: LeftAccessory ? 4 : 0 },
    { paddingEnd: RightAccessory ? 4 : 0 },
    $inputWrapperStyleOverride,
  ];

  const inputStyles = [
    {
      color: colors.text,
    },
    styles.inputStyle,
    disabled && { color: colors.textDim },
    TextInputProps.multiline && { height: 'auto' },
    $inputStyleOverride,
  ];

  const $helperStyles = [
    styles.helperStyle,
    status === 'error' && { color: colors.error },
    HelperTextProps?.style,
  ];

  // Register with FocusManager - includes getCurrentValue callback for accessing input value
  // without waiting for blur events
  useEffect(() => {
    if (focusManager && !disabled) {
      focusManager.registerField(
        fieldId,
        () => {
          // Call onBlur handler directly if provided to ensure blur logic executes
          // Calling input.current?.blur() doesn't reliably trigger onBlur in React Native
          if (TextInputProps.onBlur) {
            TextInputProps.onBlur({} as any);
          }
          input.current?.blur();
        },
        getValueFromInput,
      );
      return () => {
        focusManager.unregisterField(fieldId);
      };
    }
  }, [fieldId, focusManager, disabled, TextInputProps.onBlur, getValueFromInput]);

  function focusInput() {
    if (disabled) return;

    input.current?.focus();
  }

  useImperativeHandle(ref, () => input.current as TextInput);

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={$containerStyles}
      onPress={focusInput}
      accessibilityState={{ disabled }}
    >
      {!!label && <Text txtSize="formLabel" text={label} style={$labelStyles} {...LabelTextProps} />}

      <View style={$inputWrapperStyles}>
        {!!LeftAccessory && (
          <View
            pointerEvents="none"
            style={[(styles.leftAccessoryContainerStyle, { backgroundColor: colors.neutral200 })]}
          >
            <LeftAccessory
              style={styles.leftAccessoryStyle}
              status={status}
              editable={!disabled}
              multiline={TextInputProps.multiline ?? false}
            />
          </View>
        )}

        <TextInput
          ref={input}
          underlineColorAndroid={colors.transparent}
          textAlignVertical="top"
          placeholder={placeholderContent}
          placeholderTextColor={colors.textDim}
          {...TextInputProps}
          editable={!disabled}
          style={inputStyles}
        />

        {!!RightAccessory && (
          <View
            pointerEvents="none"
            style={[styles.rightAccessoryContainerStyle, { backgroundColor: colors.neutral200 }]}
          >
            <RightAccessory
              style={styles.rightAccessoryStyle}
              status={status}
              editable={!disabled}
              multiline={TextInputProps.multiline ?? false}
            />
          </View>
        )}
      </View>

      {!!helper && <Text txtSize="standard" text={helper} {...HelperTextProps} style={$helperStyles} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  labelStyle: { marginBottom: 4 },
  inputWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    paddingEnd: 8,
  },
  inputStyle: {
    flex: 1,
    alignSelf: 'stretch',
    fontSize: 16,
    // https://github.com/facebook/react-native/issues/21720#issuecomment-532642093
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginVertical: 4,
    marginHorizontal: 10,
  },
  helperStyle: {
    marginTop: 8,
  },

  rightAccessoryContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAccessoryStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAccessoryContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAccessoryStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
