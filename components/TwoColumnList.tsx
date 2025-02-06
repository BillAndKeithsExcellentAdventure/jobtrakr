import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Image, StyleSheet, FlatList, Platform, GestureResponderEvent } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import ButtonBar, { ActionButtonProps } from '@/components/ButtonBar';

// Define types for the props
export interface TwoColumnListEntry {
  entryId: number;
  primaryTitle: string;
  imageUri?: string;
  secondaryTitle?: string;
  lines?: { left: string; right: string }[];
}

export function TwoColumnList({
  data,
  onPress,
  buttons,
}: {
  data: TwoColumnListEntry[];
  onPress: (item: TwoColumnListEntry) => void;
  buttons: ActionButtonProps[] | null | undefined;
}) {
  const colorScheme = useColorScheme();
  let showsVerticalScrollIndicator = false;
  if (Platform.OS === 'web') {
    showsVerticalScrollIndicator = true;
  }

  // Define colors based on the color scheme (dark or light)
  const colors =
    colorScheme === 'dark'
      ? {
          listBackground: Colors.dark.listBackground,
          itemBackground: Colors.dark.itemBackground,
          iconColor: Colors.dark.iconColor,
          shadowColor: Colors.dark.shadowColor,
          boxShadow: Colors.dark.boxShadow,
        }
      : {
          listBackground: Colors.light.listBackground,
          itemBackground: Colors.light.itemBackground,
          iconColor: Colors.light.iconColor,
          shadowColor: Colors.light.shadowColor,
          boxShadow: Colors.light.boxShadow,
        };

  if (Platform.OS === 'web') {
    colors.listBackground = '#efefef';
  }

  const boxShadow = Platform.OS === 'web' ? colors.boxShadow : undefined;
  const renderItem = ({ item }: { item: TwoColumnListEntry }) => (
    <View
      style={[
        styles.itemContainer,
        { backgroundColor: colors.itemBackground, shadowColor: colors.shadowColor, boxShadow },
      ]}
    >
      <Pressable onPress={(e) => onPress(item)} style={{ width: '100%' }}>
        <View style={styles.itemContentContainer}>
          {item.imageUri && (
            <View style={styles.imageContentContainer}>
              <Image
                source={require('@/assets/images/hardHat.png')}
                tintColor={colors.iconColor}
                style={{ height: 60, width: 60 }}
              />
            </View>
          )}
          <View style={[styles.textContentContainer, { backgroundColor: colors.itemBackground }]}>
            {/* Row for Title */}
            <View style={styles.titleRow}>
              <Text txtSize='title'>{item.primaryTitle}</Text>
              <Text txtSize='standard'>{item.secondaryTitle}</Text>
            </View>

            {/* Row for Subtitles */}
            {item.lines &&
              item.lines.map((line, index) => (
                <View style={styles.subtitleRow} key={index}>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextLeft]}>{line.left}</Text>
                  </View>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextRight]}>{line.right}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </Pressable>
      {buttons && <ButtonBar buttons={buttons} actionContext={item} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
      <FlatList
        style={[styles.flatList, { backgroundColor: colors.listBackground }]}
        data={data}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyExtractor={(item) => item.entryId.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  flatList: {
    flex: 1,
    padding: 10,
    width: '100%',
  },

  itemContainer: {
    marginBottom: 10,
    borderRadius: 15,
    elevation: 4, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    padding: 10,
  },

  itemContentContainer: {
    flexDirection: 'row',
  },
  imageContentContainer: {
    marginRight: 10,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  subtitleColumn: {
    flex: 1,
  },
  subtitleTextLeft: {
    textAlign: 'left',
  },
  subtitleTextRight: {
    textAlign: 'right',
  },
});
