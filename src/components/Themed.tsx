/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Text as DefaultText,
  TextInput as DefaultTextInput,
  View as DefaultView,
  TextStyle,
} from 'react-native';

import { Colors } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ThemedTextProps = {
  txtSize?:
    | 'xxs'
    | 'xs'
    | 'standard'
    | 'formLabel'
    | 'sub-title'
    | 'section-header'
    | 'title'
    | 'screen-header'
    | 'xl'
    | 'xxl';
  text?: string;
};

export type TextInputProps = ThemedTextProps & ThemeProps & DefaultTextInput['props'];
export type TextProps = ThemedTextProps & ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, txtSize, text, children, ...otherProps } = props;

  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // Default text style
  let txtStyle: TextStyle = { fontSize: 14, fontWeight: 'normal', lineHeight: 18, alignItems: 'center' };

  // Set the default fontSize and fontWeight based on txtSize
  if (txtSize) {
    switch (txtSize) {
      case 'xxs':
        txtStyle.fontSize = 12;
        txtStyle.fontWeight = 'thin';
        txtStyle.lineHeight = 16;
        break;
      case 'xs':
        txtStyle.fontSize = 14;
        txtStyle.fontWeight = 'normal';
        txtStyle.lineHeight = 18;
        break;
      case 'standard':
        txtStyle.fontSize = 16;
        txtStyle.fontWeight = 'normal';
        txtStyle.lineHeight = 20;
        break;
      case 'formLabel':
        txtStyle.fontSize = 12;
        txtStyle.fontWeight = 'medium';
        txtStyle.lineHeight = 16;
        break;
      case 'section-header':
        txtStyle.fontSize = 18;
        txtStyle.fontWeight = '500';
        txtStyle.lineHeight = 22;
        break;
      case 'sub-title':
        txtStyle.fontSize = 18;
        txtStyle.fontWeight = 'medium';
        txtStyle.lineHeight = 22;
        break;
      case 'title':
        txtStyle.fontSize = 20;
        txtStyle.fontWeight = '600';
        txtStyle.lineHeight = 26;
        break;
      case 'xl':
        txtStyle.fontSize = 24;
        txtStyle.fontWeight = 'bold';
        txtStyle.lineHeight = 30;
        break;
      case 'xxl':
        txtStyle.fontSize = 36;
        txtStyle.fontWeight = '600';
        txtStyle.lineHeight = 42;
        break;
      case 'screen-header':
        txtStyle.fontSize = 18;
        txtStyle.fontWeight = '500';
        txtStyle.lineHeight = 20;
        break;
    }
  }

  const content = text || children;

  // Return the text component with merged styles
  return (
    <DefaultText style={[{ color }, txtStyle, style]} {...otherProps}>
      {content}
    </DefaultText>
  );
}

export function TextInput(props: TextInputProps) {
  const { style, lightColor, darkColor, txtSize, ...otherProps } = props;
  const colors = useColors();

  // Default text style
  let txtStyle: TextStyle = { fontSize: 16, fontWeight: 'normal', lineHeight: 20, alignItems: 'center' };

  // Set the default fontSize and fontWeight based on txtSize
  if (txtSize) {
    switch (txtSize) {
      case 'xxs':
        txtStyle.fontSize = 12;
        txtStyle.fontWeight = 'thin';
        txtStyle.lineHeight = 16;
        break;
      case 'xs':
        txtStyle.fontSize = 14;
        txtStyle.fontWeight = 'normal';
        txtStyle.lineHeight = 18;
        break;
      case 'standard':
        txtStyle.fontSize = 16;
        txtStyle.fontWeight = 'normal';
        break;
      case 'formLabel':
        txtStyle.fontSize = 16;
        txtStyle.fontWeight = 'medium';
        txtStyle.lineHeight = 20;
        break;
      case 'sub-title':
        txtStyle.fontSize = 18;
        txtStyle.fontWeight = 'medium';
        txtStyle.lineHeight = 22;
        break;
      case 'title':
        txtStyle.fontSize = 20;
        txtStyle.fontWeight = '600';
        txtStyle.lineHeight = 24;
        break;
      case 'xl':
        txtStyle.fontSize = 24;
        txtStyle.fontWeight = 'bold';
        txtStyle.lineHeight = 30;
        break;
      case 'xxl':
        txtStyle.fontSize = 36;
        txtStyle.fontWeight = '600';
        txtStyle.lineHeight = 42;
        break;
      case 'screen-header':
        txtStyle.fontSize = 16;
        txtStyle.fontWeight = '500';
        txtStyle.lineHeight = 20;
        break;
    }
  }

  // Return the text component with merged styles
  return (
    <DefaultTextInput
      style={[{ color: colors.text, borderColor: colors.border, justifyContent: 'center' }, txtStyle, style]}
      {...otherProps}
      placeholderTextColor={colors.placeHolder}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
