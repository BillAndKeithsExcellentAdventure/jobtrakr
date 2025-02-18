import React, { useState, FC, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text, LayoutChangeEvent } from 'react-native';

export interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const CustomSwitch: FC<CustomSwitchProps> = ({ value, onValueChange }) => {
  const [animValue] = useState(new Animated.Value(value ? 1 : 0));
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbWidth = 16; // Width of the switch thumb

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const toggleSwitch = () => {
    const newValue = !value;
    Animated.timing(animValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onValueChange(newValue);
  };

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, containerWidth - thumbWidth - 2], // Dynamic calculation
  });

  return (
    <TouchableOpacity
      style={[styles.switchContainer, value && styles.switchContainerOn]}
      onPress={toggleSwitch}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginBottom: 10,
    fontSize: 20,
  },
  switchContainer: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#008015',
    justifyContent: 'center',
    padding: 2,
  },
  switchContainerOn: {
    backgroundColor: '#6200ee',
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});
