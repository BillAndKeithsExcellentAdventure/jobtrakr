import React, { FC, useCallback, useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, TouchableOpacity } from 'react-native';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isOffOnToggle?: boolean;
  size?: 'small' | 'medium' | 'large';
  switchContainerOffBackgroundColor?: string;
  switchContainerOnBackgroundColor?: string;
}

export const Switch: FC<SwitchProps> = ({
  value,
  onValueChange,
  isOffOnToggle: isOnOffToggle = false,
  size = 'small',
  switchContainerOffBackgroundColor,
  switchContainerOnBackgroundColor,
}) => {
  const [animValue] = useState(new Animated.Value(value ? 1 : 0));
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbWidth = size === 'large' ? 26 : size === 'medium' ? 21 : 16; // Width of the switch thumb

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const toggleSwitch = useCallback(() => {
    const newValue = !value;
    Animated.timing(animValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onValueChange(newValue);
  }, [value, animValue, onValueChange]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, containerWidth - thumbWidth - 3], // Dynamic calculation
  });

  const switchBackgroundColor = value
    ? switchContainerOnBackgroundColor
      ? { backgroundColor: switchContainerOnBackgroundColor }
      : styles.switchContainerOn
    : switchContainerOffBackgroundColor
      ? { backgroundColor: switchContainerOffBackgroundColor }
      : styles.switchContainerOff;

  return (
    <TouchableOpacity
      style={[
        styles.switchContainer,
        size === 'medium' && styles.switchContainerMedium,
        size === 'large' && styles.switchContainerLarge,
        switchBackgroundColor,
      ]}
      onPress={toggleSwitch}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          size === 'large' && styles.switchThumbLarge,
          size === 'medium' && styles.switchThumbMedium,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    padding: 2,
  },
  switchContainerMedium: {
    width: 50,
    height: 25,
    borderRadius: 12.5,
  },
  switchContainerLarge: {
    width: 60,
    height: 30,
    borderRadius: 15,
  },
  switchContainerOn: {
    backgroundColor: '#1E88E5',
  },
  switchContainerOff: {
    backgroundColor: '#D1D1D6',
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  switchThumbMedium: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#fff',
  },
  switchThumbLarge: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
