import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';

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
      <Image style={{ width, height }} source={{ uri: `data:image/png;base64,${base64String}` }} />
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
