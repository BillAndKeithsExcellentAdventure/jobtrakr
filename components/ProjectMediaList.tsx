import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { ActionButton } from '@/components/ActionButton';
import Base64Image from '@/components/Base64Image';
import { formatDate } from '@/utils/formatters';
import { MediaEntryData } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';

export interface MediaEntryDisplayData extends MediaEntryData {
  isSelected: boolean;
}

interface ProjectMediaListProps {
  mediaItems: MediaEntryDisplayData[];
  onSelectItem: (id: string) => void;
  onImagePress: (uri: string, type: 'video' | 'photo', photoDate: string) => void;
  onSelectAll: () => void;
  onRemove: () => void;
  onSetThumbnail: () => void;
  showDeviceAssets: boolean;
}

export const ProjectMediaList = ({
  mediaItems,
  onSelectItem,
  onImagePress,
  onSelectAll,
  onRemove,
  onSetThumbnail,
  showDeviceAssets,
}: ProjectMediaListProps) => {
  const selectedCount = mediaItems.filter((media) => media.isSelected).length;
  const hasSelectedItems = mediaItems.some((media) => media.isSelected);

  const renderItem = useCallback(
    ({ item }: { item: MediaEntryDisplayData }) => {
      const photoDate = formatDate(item.creationDate);
      return (
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={[styles.imageContainer, item.isSelected && styles.imageSelected]}
            onPress={() => onSelectItem(item.id)}
            onLongPress={() => onImagePress(item.mediaUri, item.mediaType, photoDate)}
          >
            <View style={styles.mediaContentContainer}>
              <Base64Image base64String={item.thumbnail} height={100} width={100} />
              <Text style={styles.dateOverlay}>{photoDate}</Text>
              {item.mediaType === 'video' && (
                <View style={styles.playButtonOverlay}>
                  <Ionicons name="play" size={30} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [onSelectItem, onImagePress],
  );

  return (
    <View style={styles.listColumn}>
      <View style={{ alignItems: 'center' }}>
        <Text txtSize="title" style={styles.listTitle}>
          Project Photos
        </Text>
        <Text txtSize="sub-title" style={{ marginLeft: 10 }}>
          {`Project contains ${mediaItems.length} pictures.`}
        </Text>
      </View>

      {mediaItems.length === 0 ? (
        <View style={{ alignItems: 'center' }}>
          <Text>Use menu button to add photos.</Text>
        </View>
      ) : (
        <>
          <View style={styles.selectRow}>
            <TouchableOpacity onPress={onSelectAll} style={styles.selectAllButton}>
              <Ionicons
                name={hasSelectedItems ? 'ellipse-sharp' : 'ellipse-outline'}
                size={24}
                color="#007AFF"
              />
              <Text>{hasSelectedItems ? 'Clear Selection' : 'Select All'}</Text>
            </TouchableOpacity>
            {hasSelectedItems && <Text>{`${selectedCount} selected`}</Text>}
          </View>

          <FlashList
            numColumns={showDeviceAssets ? 1 : 2}
            data={mediaItems}
            estimatedItemSize={200}
            renderItem={renderItem}
          />

          {hasSelectedItems && (
            <View style={styles.buttonContainer}>
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <ActionButton title="Remove" onPress={onRemove} type="action" />
                </View>
                {selectedCount === 1 && (
                  <View style={styles.buttonWrapper}>
                    <ActionButton
                      title="Thumbnail"
                      style={{ paddingHorizontal: 1 }}
                      onPress={onSetThumbnail}
                      type="action"
                    />
                  </View>
                )}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listTitle: {
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 10,
  },
  selectRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonWrapper: {
    flex: 1,
  },
  mediaContentContainer: {
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
  imageSelected: {
    borderColor: '#007AFF',
  },
  imageContainer: {
    position: 'relative',
    flex: 1,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: 5,
    borderRadius: 4,
    fontSize: 12,
  },
  listColumn: {
    flex: 1,
    padding: 10,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
