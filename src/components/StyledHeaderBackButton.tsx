import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

/**
 * A styled HeaderBackButton that matches the default expo-router header styling.
 * This addresses the issue where the default HeaderBackButton from @react-navigation/elements
 * appears too small and has too much left margin compared to the default expo-router header.
 */
export const StyledHeaderBackButton: React.FC<HeaderBackButtonProps> = (props) => {
  return (
    <HeaderBackButton
      {...props}
      style={[
        styles.backButton,
        props.style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  backButton: {
    // Apply negative left margin to align with expo-router's default header positioning
    marginLeft: Platform.OS === 'ios' ? -8 : -4,
  },
});
