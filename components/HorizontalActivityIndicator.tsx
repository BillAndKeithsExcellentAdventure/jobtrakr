// First, add Animated to the React Native imports at the top
import React from 'react';
import {
  StyleSheet,
  Image,
  Button,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';

// Add this new component near the top of the file, before ProjectPhotosPage
interface HorizontalLoadingIndicatorProps {
  width?: number; // Make it optional with a default value
}

export const HorizontalLoadingIndicator: React.FC<HorizontalLoadingIndicatorProps> = ({ width = 50 }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(translateX, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(animation).start();
  }, []);

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            width: width * 2,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width * 8], // Use the width parameter here
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

// Add these new styles to your StyleSheet
const styles = StyleSheet.create({
  // ... existing styles ...
  progressBarContainer: {
    width: '100%',
    height: 2,
    backgroundColor: '#eee',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
});
