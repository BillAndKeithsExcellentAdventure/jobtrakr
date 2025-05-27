import { useColors } from '@/src/context/ColorsContext';
import React, { useState, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Text, View } from './Themed';

interface ZoomImageViewerProps {
  imageUri: string;
}

export const ZoomImageViewer: React.FC<ZoomImageViewerProps> = React.memo(({ imageUri }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const colors = useColors();

  // Shared values for zoom and pan
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Memoized gestures to prevent re-creation
  const combinedGesture = useMemo(() => {
    const pinchGesture = Gesture.Pinch().onChange((event) => {
      scale.value = event.scale >= 1 ? event.scale : 1;
    });

    const panGesture = Gesture.Pan().onChange((event) => {
      offsetX.value += event.changeX;
      offsetY.value += event.changeY;
    });

    return Gesture.Simultaneous(pinchGesture, panGesture);
  }, []);

  // Memoized animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  if (!imageUri) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text txtSize="title" text="No Image Specified" />
      </View>
    );
  }

  // onLayout function to get the container dimensions
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
      <View style={styles.overlay} onLayout={onLayout}>
        {containerWidth > 0 && containerHeight > 0 && (
          <GestureDetector gesture={combinedGesture}>
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  width: containerWidth * 0.95,
                  height: containerHeight * 0.95,
                },
              ]}
            >
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.image, animatedStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </View>
  );
});

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
