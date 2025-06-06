// components/ScreenHeader.tsx - For use on Android devices when headerLeft or headRight components are specified.

import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React, { JSX } from 'react';
import { FlexAlignType, Platform, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the type for the props
export interface ScreenHeaderProps {
  headerLeft?: () => JSX.Element | null; // Optional component for the left side
  headerRight?: () => JSX.Element | null; // Optional component for the right side
  title: string; // Title for the header
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ headerLeft, headerRight, title }) => {
  const insets = useSafeAreaInsets(); // just in case we use it on IOS

  let alignItems: FlexAlignType = 'flex-start';

  if (Platform.OS === 'ios') {
    alignItems = 'center';
  }

  const colors = useColors();
  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          marginTop: insets.top,
          borderColor: colors.separatorColor,
        },
      ]}
    >
      {/* Left Header Component */}
      {headerLeft && <View style={styles.headerLeft}>{headerLeft()}</View>}
      {/* Title */}
      <View style={[styles.headerTitleContainer, { alignItems }]}>
        <Text txtSize="screen-header">{title}</Text>
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
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  } as ViewStyle, // Type for the header container style
  headerLeft: {
    marginLeft: 10,
    justifyContent: 'center',
  } as ViewStyle,
  headerTitleContainer: {
    marginLeft: 10,
    flex: 1,
    alignItems: 'flex-start',
  } as ViewStyle,
  headerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  } as ViewStyle,
});
