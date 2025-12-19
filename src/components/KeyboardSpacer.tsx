import React from 'react';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { PADDING_BOTTOM } from './useKeyboardGradualAnimation';

interface KeyboardSpacerProps {
  height: SharedValue<number>;
}

export const KeyboardSpacer = React.memo(({ height }: KeyboardSpacerProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      height: Math.abs(height.value),
      marginBottom: height.value > 0 ? 0 : PADDING_BOTTOM,
    };
  });

  return <Animated.View style={animatedStyle} />;
});
KeyboardSpacer.displayName = 'KeyboardSpacer';
