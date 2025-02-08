// components/ScreenHeader.tsx - For use on Android devices when headerLeft or headRight components are specified.

import React from 'react';
import { StyleSheet, ViewStyle, Platform, FlexAlignType } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the type for the props
export interface ScreenHeaderProps {
  headerLeft?: () => JSX.Element | null; // Optional component for the left side
  headerRight?: () => JSX.Element | null; // Optional component for the right side
  title: string; // Title for the header
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ headerLeft, headerRight, title }) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // just in case we use it on IOS

  let alignItems: FlexAlignType = 'flex-start';

  if (Platform.OS === 'ios') {
    alignItems = 'center';
  }

  // Define colors based on the color scheme (dark or light)
  const colors =
    colorScheme === 'dark'
      ? {
          screenBackground: Colors.dark.background,
          separatorColor: Colors.dark.separatorColor,
        }
      : {
          screenBackground: Colors.light.background,
          separatorColor: Colors.light.separatorColor,
        };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.screenBackground,
          marginTop: insets.top,
          marginStart: 15,
          borderColor: colors.separatorColor,
        },
      ]}
    >
      {/* Left Header Component */}
      {headerLeft && <View style={styles.headerLeft}>{headerLeft()}</View>}
      {/* Title */}
      <View style={[styles.headerTitleContainer, { alignItems }]}>
        <Text txtSize='screen-header'>{title}</Text>
      </View>

      {/* Right Header Component */}
      <View style={styles.headerRight}>{headerRight ? headerRight() : null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  } as ViewStyle, // Type for the header container style
  headerLeft: {
    justifyContent: 'center',
    marginRight: 20,
  } as ViewStyle,
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  } as ViewStyle,
  headerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  } as ViewStyle,
});
