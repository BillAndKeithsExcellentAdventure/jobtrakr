import React, { useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from './useColorScheme';
import { useFocusManager } from '../hooks/useFocusManager';

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  type: 'action' | 'ok' | 'cancel' | 'disabled';
  style?: ViewStyle; // Optional custom border style
  textStyle?: TextStyle; // Optional custom text style
  triggerBlurOnPress?: boolean; // Optional flag to trigger blur on press
};

interface ButtonSettings {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  type,
  style,
  textStyle,
  triggerBlurOnPress = true,
}) => {
  const platform = Platform.OS; // Get the current platform (iOS or Android)
  const colorScheme = useColorScheme();
  const focusManager = useFocusManager();
  const handlePress = useCallback(() => {
    if (type === 'disabled') return;

    if (triggerBlurOnPress) {
      // call focusManger to blur all fields before invoking onPress
      focusManager?.blurAllFields();
    }

    setTimeout(() => {
      onPress();
    }, 0);
  }, [onPress, type, triggerBlurOnPress]);

  const getButtonStyles = (buttonType: ActionButtonProps['type'], platform: string): ButtonSettings => {
    switch (buttonType) {
      case 'action':
        return {
          backgroundColor: '#1E88E5', // Material Blue
          borderColor: '#1E88E5',
          color: '#fff',
        };
      case 'ok':
        return {
          backgroundColor: '#4CAF50', // Material Green
          borderColor: '#4CAF50',
          color: '#fff',
        };
      case 'cancel':
        return {
          backgroundColor: '#F44336', // Material Red
          borderColor: '#F44336',
          color: '#fff',
        };
      case 'disabled':
        if (colorScheme === 'dark') {
          return {
            backgroundColor: '#616161',
            borderColor: '#4a4a4a',
            color: '#b0b0b0',
          };
        }
        if (platform === 'ios') {
          return {
            backgroundColor: '#D1D1D6', // iOS Disabled Grey (light grey)
            borderColor: '#8E8E93', // iOS Disabled Text Color
            color: '#8E8E93', // iOS Disabled Text Color
          };
        } else {
          return {
            backgroundColor: '#BDBDBD', // Material Disabled Grey (light grey)
            borderColor: '#757575', // Muted text color (same for border)
            color: '#757575', // Disabled text color (same for text)
          };
        }
    }
    return {
      backgroundColor: '#1E88E5', // Material Blue
      borderColor: '#1E88E5',
      color: '#fff',
    };
  };

  const { backgroundColor, borderColor, color } = getButtonStyles(type, platform);

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.button, { backgroundColor, borderColor }, style]}>
      <Text style={[styles.buttonText, { color }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
