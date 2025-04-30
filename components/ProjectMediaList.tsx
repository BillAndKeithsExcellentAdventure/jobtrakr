import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { ActionButton } from '@/components/ActionButton';
import Base64Image from '@/components/Base64Image';
import { formatDate } from '@/utils/formatters';
import { MediaEntryData, useDeleteRowCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { createThumbnail } from '@/utils/thumbnailUtils';
import { useProjectValue } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useRouter } from 'expo-router';
import { useAddImageCallback } from '@/utils/images';

export interface MediaEntryDisplayData extends MediaEntryData {
  isSelected: boolean;
}

interface ProjectMediaListProps {
  projectMediaItems: MediaEntryData[];
  projectId: string;
  projectName: string;
  showInSingleColum: boolean;
  playVideo: (videoUri: string) => void;
}

export const ProjectMediaList = ({
  projectMediaItems,
  projectId,
  projectName,
  showInSingleColum,
  playVideo,
}: ProjectMediaListProps) => {
  const [mediaItems, setMediaItems] = useState<MediaEntryDisplayData[]>([]);
  const [, setThumbnail] = useProjectValue(projectId, 'thumbnail');
  const removePhotoData = useDeleteRowCallback(projectId, 'mediaEntries');
  const router = useRouter();

  useEffect(() => {
    // Initialize selectableProjectMedia whenever allProjectMedia changes
    setMediaItems(projectMediaItems.map((m) => ({ ...m, isSelected: false })));
  }, [projectMediaItems]);

  const selectedCount = useMemo(() => mediaItems.filter((media) => media.isSelected).length, [mediaItems]);
  const hasSelectedItems = useMemo(() => mediaItems.some((media) => media.isSelected), [mediaItems]);

  const onSetThumbnail = useCallback(async () => {
    const selectedIds = mediaItems.filter((media) => media.isSelected).map((media) => media.id);
    if (selectedIds.length === 1) {
      const asset = mediaItems.find((asset) => asset.id === selectedIds[0]);
      if (asset) {
        const tn = await createThumbnail(asset.mediaUri);
        if (tn) {
          setThumbnail(tn);
        }
      }
    }
  }, [mediaItems]);

  const onSelectAll = useCallback(() => {
    const hasSelectedItems = mediaItems.some((media) => media.isSelected);
    setMediaItems((prevMedia) =>
      prevMedia.map((media) => ({
        ...media,
        isSelected: !hasSelectedItems,
      })),
    );
  }, [mediaItems]);

  const getSelectedIds = useCallback(() => {
    return mediaItems.filter((media) => media.isSelected).map((media) => media.id);
  }, [mediaItems]);

  const handleSelection = useCallback(async (id: string) => {
    setMediaItems((prevMedia) =>
      prevMedia.map((media) => (media.id === id ? { ...media, isSelected: !media.isSelected } : media)),
    );
  }, []);

  const handleImageLongPress = useCallback((uri: string, type: 'video' | 'photo', photoDate: string) => {
    if (type === 'video') {
      playVideo(uri);
    } else if (type === 'photo') {
      console.log(`photoDate=${photoDate}`);
      const dateString = photoDate ?? 'No Date Info Available';
      router.push(
        `/projects/${projectId}/photos/showImage/?uri=${uri}&projectName=${encodeURIComponent(
          projectName,
        )}&photoDate=${dateString}`,
      );
    }
  }, []);

  const onRemove = useCallback(async () => {
    const selectedIds = mediaItems.filter((media) => media.isSelected).map((media) => media.id);
    Alert.alert('Remove Photos', 'Are you sure you want to remove these photos from this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          for (const uId of selectedIds) {
            removePhotoData(uId);
          }
        },
      },
    ]);
  }, [removePhotoData, mediaItems]);

  const renderItem = useCallback(
    ({ item }: { item: MediaEntryDisplayData }) => {
      const photoDate = formatDate(item.creationDate);
      return (
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={[styles.imageContainer, item.isSelected && styles.imageSelected]}
            onPress={() => handleSelection(item.id)}
            onLongPress={() => handleImageLongPress(item.mediaUri, item.mediaType, photoDate)}
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
    [handleSelection, handleImageLongPress],
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
          <Text>Use menu button to import photos.</Text>
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
            numColumns={showInSingleColum ? 1 : 2}
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
