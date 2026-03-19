import { useColors } from '@/src/context/ColorsContext';
import { resolveMediaLibraryUriForDisplay } from '@/src/utils/mediaAssetsHelper';
import { Image } from 'expo-image';
import React, { useState, useMemo, useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Text, View } from './Themed';

interface ZoomImageViewerProps {
  imageUri: string;
}

const AnimatedExpoImage = Animated.createAnimatedComponent(Image);

export const ZoomImageViewer: React.FC<ZoomImageViewerProps> = React.memo(({ imageUri }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [resolvedImageUri, setResolvedImageUri] = useState(imageUri);
  const [isResolvingUri, setIsResolvingUri] = useState(false);
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
  }, [scale, offsetX, offsetY]);

  // Memoized animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  useEffect(() => {
    let isMounted = true;

    const resolveImageUri = async () => {
      if (!imageUri) {
        if (isMounted) {
          setResolvedImageUri('');
        }
        return;
      }

      if (isMounted) {
        setIsResolvingUri(true);
      }

      try {
        const displayUri = await resolveMediaLibraryUriForDisplay(imageUri);

        if (isMounted) {
          setResolvedImageUri(displayUri);
        }
      } catch (error) {
        console.error('Failed to resolve iOS photo URI for display:', error);
        if (isMounted) {
          setResolvedImageUri(imageUri);
        }
      } finally {
        if (isMounted) {
          setIsResolvingUri(false);
        }
      }
    };

    void resolveImageUri();

    return () => {
      isMounted = false;
    };
  }, [imageUri]);

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
        {isResolvingUri && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
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
              <AnimatedExpoImage
                source={{ uri: resolvedImageUri }}
                style={[styles.image, animatedStyle]}
                contentFit="contain"
              />
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </View>
  );
});
ZoomImageViewer.displayName = 'ZoomImageViewer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
  imageContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
