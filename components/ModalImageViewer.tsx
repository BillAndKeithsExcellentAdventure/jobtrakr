import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from './useColorScheme';
import { Colors } from '@/constants/Colors';

interface ModalImageViewerProps {
  imageUri: string;
  onClose: () => void;
}

export const ModalImageViewer: React.FC<ModalImageViewerProps> = ({ imageUri, onClose }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offset = useSharedValue({ x: 0, y: 0 });
  const start = useSharedValue({ x: 0, y: 0 });

  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.opaqueModalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.opaqueModalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      start.value = { x: offset.value.x, y: offset.value.y };
    })
    .onUpdate((e) => {
      offset.value = {
        x: start.value.x + e.translationX,
        y: start.value.y + e.translationY,
      };
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(scale.value === 1 ? 2 : 1);
      savedScale.value = scale.value;
      offset.value = withSpring({ x: 0, y: 0 });
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value.x }, { translateY: offset.value.y }, { scale: scale.value }],
  }));

  const handleClose = useCallback((): void => {
    scale.value = withSpring(1);
    savedScale.value = scale.value;
    offset.value = withSpring({ x: 0, y: 0 });
    onClose();
  }, [onClose, scale, savedScale, start, offset]);

  return (
    <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.iconColor} />
        </Pressable>
      </View>
      <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        <GestureHandlerRootView>
          <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, composed)}>
            <Animated.Image
              source={{ uri: imageUri }}
              style={[styles.image, animatedStyle]}
              resizeMode="contain"
            />
          </GestureDetector>
        </GestureHandlerRootView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  closeButton: {
    padding: 8,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 60,
    minWidth: 400,
    minHeight: 800,
  },
});
