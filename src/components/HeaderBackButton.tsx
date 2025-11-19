import { Platform, Pressable, StyleSheet } from 'react-native';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useThemeColor } from './Themed';

type HeaderBackButtonProps = {
  blocked?: boolean; // shouldBlock
  onBlock?: () => void; // called when blocked navigation is attempted
};

export function HeaderBackButton({ blocked = false, onBlock }: HeaderBackButtonProps) {
  const androidArrowColor = useThemeColor({ light: undefined, dark: undefined }, 'text');
  const arrowColor = Platform.OS === 'android' ? androidArrowColor : '#007AFF';
  const size = 28;
  const handlePress = () => {
    if (blocked) {
      onBlock?.();
      return;
    }
    router.back();
  };

  return (
    <Pressable style={styles.button} onPress={handlePress} hitSlop={10}>
      {Platform.OS === 'ios' ? (
        <Entypo name="chevron-thin-left" size={size} color={arrowColor} />
      ) : (
        <Feather name="arrow-left" size={size} color={arrowColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: -10,
    justifyContent: 'flex-start',
    paddingRight: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
});
