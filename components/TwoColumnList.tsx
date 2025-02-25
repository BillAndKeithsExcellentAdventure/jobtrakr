import React, { useMemo } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet } from 'react-native';
import { ActionButtonProps, ButtonBar } from '@/components/ButtonBar';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

// Define types for the props
export interface TwoColumnListEntry {
  entryId: string;
  primaryTitle: string;
  imageUri?: string;
  secondaryTitle?: string;
  tertiaryTitle?: string;
  subtitleLines?: { left: string; right: string }[];
  lines?: { left: string; right: string }[];
  isFavorite?: boolean;
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
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            boxShadow: Colors.dark.boxShadow,
            borderColor: Colors.dark.borderColor,
          }
        : {
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            boxShadow: Colors.light.boxShadow,
            borderColor: Colors.light.borderColor,
          },
    [colorScheme],
  );

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
          <View style={styles.headerContentContainer}>
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
                <Text numberOfLines={1} ellipsizeMode="tail" txtSize="title">
                  {item.primaryTitle}
                </Text>
              </View>
              {item.secondaryTitle && (
                <View style={styles.secondardyTitleRow}>
                  <Text numberOfLines={1} ellipsizeMode="tail" txtSize="standard">
                    {item.secondaryTitle}
                  </Text>
                </View>
              )}
              {item.tertiaryTitle && (
                <View style={styles.secondardyTitleRow}>
                  <Text numberOfLines={1} ellipsizeMode="tail" txtSize="standard">
                    {item.tertiaryTitle}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View
            style={[
              styles.textContentContainer,
              {
                backgroundColor: colors.itemBackground,
                borderTopColor: colors.borderColor,
                borderTopWidth: 1,
                marginTop: 5,
                paddingTop: 5,
              },
            ]}
          >
            {/* Row for Subtitles */}
            {item.subtitleLines &&
              item.subtitleLines.map((line, index) => (
                <View style={styles.subtitleRow} key={index}>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextLeft]} numberOfLines={1} ellipsizeMode="tail">
                      {line.left}
                    </Text>
                  </View>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextRight]} numberOfLines={1} ellipsizeMode="tail">
                      {line.right}
                    </Text>
                  </View>
                </View>
              ))}

            {/* Row for Details */}
            {item.lines &&
              item.lines.map((line, index) => (
                <View style={styles.subtitleRow} key={index}>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextLeft]} numberOfLines={1} ellipsizeMode="tail">
                      {line.left}
                    </Text>
                  </View>
                  <View style={styles.subtitleColumn}>
                    <Text style={[styles.subtitleTextRight]} numberOfLines={1} ellipsizeMode="tail">
                      {line.right}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </Pressable>
      {buttons && <ButtonBar buttons={buttons} actionContext={item} isFavorite={item.isFavorite} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
      <FlatList
        style={[styles.flatList, { backgroundColor: colors.listBackground }]}
        data={data}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyExtractor={(item) => item.entryId}
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
    flexDirection: 'column',
  },
  headerContentContainer: {
    flexDirection: 'row',
  },

  imageContentContainer: {
    marginRight: 5,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  secondardyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'hidden',
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
