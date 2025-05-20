import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface SwipeableProps {
  children: ReactNode;
  threshold?: number;
  maxSwipeDistance?: number;
  renderLeftActions?: () => ReactNode;
  renderRightActions?: () => ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SwipeableComponent: React.FC<SwipeableProps> = ({
  children,
  threshold = 100,
  maxSwipeDistance = 100, // max visible translation
  renderLeftActions,
  renderRightActions,
  containerStyle,
}) => {
  const translateX = useSharedValue(0);
  const gestureOffset = useSharedValue(0); // tracks full gesture
  const isOpen = useSharedValue(false);
  const openDirection = useSharedValue<'left' | 'right' | null>(null);
  const isHorizontal = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-10, 10]) // Fail gesture if vertical movement exceeds 10px
    .onTouchesDown(() => {
      isHorizontal.value = false;
    })
    .onUpdate((event) => {
      if (isOpen.value) return; // prevent dragging open cell

      const dx = event.translationX;

      // If swiping right and no left actions → block
      if (dx > 0 && !renderLeftActions) {
        translateX.value = 0;
        return;
      }

      // If swiping left and no right actions → block
      if (dx < 0 && !renderRightActions) {
        translateX.value = 0;
        return;
      }

      gestureOffset.value = dx;
      translateX.value = clamp(dx, -maxSwipeDistance, maxSwipeDistance);
    })
    .onEnd(() => {
      if (gestureOffset.value > threshold) {
        // Swiped right
        if (renderLeftActions) {
          translateX.value = withSpring(maxSwipeDistance);
          isOpen.value = true;
          openDirection.value = 'right';
        }
      } else if (gestureOffset.value < -threshold) {
        // Swiped left
        if (renderRightActions) {
          translateX.value = withSpring(-maxSwipeDistance);
          isOpen.value = true;
          openDirection.value = 'left';
        }
      } else {
        // Not far enough — reset
        translateX.value = withSpring(0);
        isOpen.value = false;
        openDirection.value = null;
      }
      gestureOffset.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20], [0, 1], 'clamp'),
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -20], [0, 1], 'clamp'),
  }));

  return (
    <View style={[styles.root, containerStyle]}>
      {/* Background Actions */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.leftAction, leftActionStyle]}>{renderLeftActions?.()}</Animated.View>
        <Animated.View style={[styles.rightAction, rightActionStyle]}>{renderRightActions?.()}</Animated.View>
      </View>

      {/* Foreground Swipeable Content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.foreground, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 0,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 0,
  },
  foreground: {
    width: '100%',
    backgroundColor: 'white',
  },
});
