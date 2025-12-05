import { ActionButtonProps, ButtonBar } from '@/src/components/ButtonBar';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import Base64Image from './Base64Image';
import { ProjectListEntryProps } from './ProjectList';
import PercentCompleteBar from './PercentCompleteBar';
import { Pressable } from 'react-native-gesture-handler';

interface ProjectListEntryComponentProps {
  item: ProjectListEntryProps;
  onPress: (item: ProjectListEntryProps) => void;
  buttons?: ActionButtonProps[] | null;
}

export function ProjectListEntry({ item, onPress, buttons }: ProjectListEntryComponentProps) {
  const colors = useColors();
  const boxShadow = Platform.OS === 'web' ? colors.boxShadow : undefined;
  const percent = item.bidPrice > 0 ? Math.round((item.amountSpent * 100) / item.bidPrice) : 0;
  return (
    <View
      style={[
        styles.itemContainer,
        { backgroundColor: colors.itemBackground, shadowColor: colors.shadowColor, boxShadow },
      ]}
    >
      <Pressable onPress={() => onPress(item)} style={{ width: '100%' }} hitSlop={0}>
        <View style={styles.itemContentContainer}>
          <View style={styles.headerContentContainer}>
            {item.imageUri && (
              <View style={styles.imageContentContainer}>
                <Base64Image base64String={item.imageUri} height={80} width={120} />
              </View>
            )}
            <View style={[styles.textContentContainer, { backgroundColor: colors.itemBackground }]}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} ellipsizeMode="tail" txtSize="title">
                  {item.projectName}
                </Text>
              </View>
              {item.location && (
                <View style={styles.secondaryTitleRow}>
                  <Text numberOfLines={1} ellipsizeMode="tail" txtSize="standard">
                    {item.location}
                  </Text>
                </View>
              )}
              {item.ownerName && (
                <View style={styles.secondaryTitleRow}>
                  <Text numberOfLines={1} ellipsizeMode="tail" txtSize="standard">
                    {item.ownerName}
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
                borderTopColor: colors.border,
                borderTopWidth: 1,
                marginTop: 5,
                paddingTop: 5,
              },
            ]}
          >
            <View style={styles.subtitleRow}>
              <PercentCompleteBar
                percent={percent}
                spent={item.amountSpent}
                total={item.bidPrice}
                labelPosition="inside" // try 'left', 'inside', etc.
                showPercentageText={false}
                height={34}
                backgroundColor={colors.percentBarBackground}
                labelColor={colors.text}
                textColor={colors.text}
                fillColor={colors.percentCompleteBackground}
              />
            </View>
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleColumn}>
                <Text
                  style={[styles.subtitleTextLeft]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  text={`Start: ${item.startDate}`}
                />
              </View>
              <View style={styles.subtitleColumn}>
                <Text
                  style={[styles.subtitleTextRight]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  text={`Finish: ${item.finishDate}`}
                />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
      {buttons && <ButtonBar buttons={buttons} actionContext={item} isFavorite={item.isFavorite} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    padding: 10,
    width: '100%',
  },
  itemContainer: {
    marginBottom: 10,
    borderRadius: 15,
    elevation: 20, // Adds shadow effect for Android
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
  secondaryTitleRow: {
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
