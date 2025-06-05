import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const Base64Image = ({
  base64String,
  width,
  height,
  style,
}: {
  base64String: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        style={{ width, height }}
        contentFit="cover"
        contentPosition="top left"
        source={{ uri: `data:image/png;base64,${base64String}` }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Base64Image;
