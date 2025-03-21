import { Colors } from '@/constants/Colors';
import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Text, View } from './Themed';
import { useColorScheme } from './useColorScheme';

interface ZoomImageViewerProps {
  imageUri: string;
}

export const ZoomImageViewer: React.FC<ZoomImageViewerProps> = ({ imageUri }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
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

  // Shared values for zoom and pan
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Define the pinch gesture for scaling
  const pinchGesture = Gesture.Pinch().onChange((event) => {
    scale.value = event.scale >= 1 ? event.scale : 1; // Update scale as the pinch gesture changes
  });

  const panGesture = Gesture.Pan().onChange((event) => {
    offsetX.value += event.changeX;
    offsetY.value += event.changeY;
  });

  // Combine the pinch and pan gestures
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for the image
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value }, // Apply scaling
        { translateX: offsetX.value }, // Apply horizontal translation
        { translateY: offsetY.value }, // Apply vertical translation
      ],
    };
  });

  if (!imageUri)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text txtSize="title" text="No Image Specified" />
      </View>
    );

  // onLayout function to get the container dimensions
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
      <View style={styles.overlay} onLayout={onLayout}>
        {containerWidth > 0 && containerHeight > 0 && (
          <GestureDetector gesture={combinedGesture}>
            <Animated.View
              style={[
                styles.imageContainer,
                { width: containerWidth * 0.95, height: containerHeight * 0.95 },
              ]}
            >
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.image, animatedStyle]}
                resizeMode={'contain'}
              />
            </Animated.View>
          </GestureDetector>
        )}
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
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
