import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useColors } from '@/src/context/ColorsContext';
/**
 * A styled HeaderBackButton that matches the default expo-router header styling.
 * This addresses the issue where the default HeaderBackButton from @react-navigation/elements
 * has too much left margin when compared to the default expo-router header.
 */
export const StyledHeaderBackButton: React.FC<HeaderBackButtonProps> = (props) => {
  const colors = useColors();

  return (
    <HeaderBackButton
      {...props}
      style={[styles.backButton, props.style]}
      tintColor={Platform.OS === 'ios' ? '#007AFF' : colors.text}
    />
  );
};

const styles = StyleSheet.create({
  backButton: {
    // Apply negative left margin to align with expo-router's default header positioning
    marginLeft: Platform.OS === 'ios' ? -8 : -4,
  },
});
