import { ActionButton } from '@/src/components/ActionButton';
import Base64Image from '@/src/components/Base64Image';
import { Text } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ImageIdAndType,
  MediaEntryData,
  useDeleteRowCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAllMediaToUpload, useUploadSyncStore } from '@/src/tbStores/UploadSyncStore';
import { formatDate } from '@/src/utils/formatters';
import {
  buildLocalMediaUri,
  deleteLocalMediaFile,
  mediaType,
  useDeleteMediaCallback,
  useGetImageCallback,
  useMakePhotosPublicCallback,
} from '@/src/utils/images';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useProjectValue } from '../tbStores/listOfProjects/ListOfProjectsStore';
import { useNetwork } from '../context/NetworkContext';

export interface MediaEntryDisplayData extends MediaEntryData {
  isSelected: boolean;
}

interface ProjectMediaListProps {
  projectMediaItems: MediaEntryData[];
  projectId: string;
  projectName: string;
  showInSingleColumn: boolean;
  playVideo: (videoUri: string) => void;
}

export const ProjectMediaList = ({
  projectMediaItems,
  projectId,
  projectName,
  showInSingleColumn,
  playVideo,
}: ProjectMediaListProps) => {
  const [mediaItems, setMediaItems] = useState<MediaEntryDisplayData[]>([]);
  const [, setThumbnail] = useProjectValue(projectId, 'thumbnail');
  const removePhotoData = useDeleteRowCallback(projectId, 'mediaEntries');
  const updateMediaEntry = useUpdateRowCallback(projectId, 'mediaEntries');
  const router = useRouter();
  const colors = useColors();
  const getImage = useGetImageCallback();
  const deleteMediaCallback = useDeleteMediaCallback();
  const mediaToUpload = useAllMediaToUpload();
  const store = useUploadSyncStore();
  const auth = useAuth();
  const { orgId } = auth;
  const setPublicStateForSelectedMedia = useMakePhotosPublicCallback();
  const { isConnected, isInternetReachable } = useNetwork();

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
        setThumbnail(asset.thumbnail);
      }
    }
  }, [mediaItems, setThumbnail]);

  const onSelectAll = useCallback(() => {
    const hasSelectedItems = mediaItems.some((media) => media.isSelected);
    setMediaItems((prevMedia) =>
      prevMedia.map((media) => ({
        ...media,
        isSelected: !hasSelectedItems,
      })),
    );
  }, [mediaItems]);

  const handleSelection = useCallback(async (id: string) => {
    setMediaItems((prevMedia) =>
      prevMedia.map((media) => (media.id === id ? { ...media, isSelected: !media.isSelected } : media)),
    );
  }, []);

  const handleImageLongPress = useCallback(
    async (imageId: string, type: mediaType, photoDate: string) => {
      if (!orgId) {
        return;
      }

      if (!imageId) {
        Alert.alert(
          'Missing Server Image ID',
          'There is no server image ID specified for this media item. This means that no larger image is available.',
        );
        return;
      }

      const uri = buildLocalMediaUri(orgId, projectId, imageId, type, 'photo');

      if (type === 'video') {
        playVideo(uri);
      } else if (type === 'photo') {
        const dateString = photoDate ?? 'No Date Info Available';

        // This uri is to a local storage location. We first need to confirm that this file exists and
        // if not, we need to call our backend and retrieve it before trying to display it.
        if (uri.startsWith('file://')) {
          // This is a local file. We need to check if it exists.
          const file = new File(uri);
          if (!file.exists) {
            // File does not exist, so we need to call our backend to retrieve it.
            console.log('*** File does not exist. Need to retrieve from backend.');
            // Call your backend API to retrieve the file and save it locally
            // After retrieving the file, you can navigate to the image viewer
            const result = await getImage(projectId, imageId, type);
            if (result.result.status !== 'Success') {
              console.error('*** Error retrieving image from backend:', result.result.msg);
              Alert.alert('Error', `Unable to retrieve image from server. ${result.result.msg}`);
              return;
            }
          }

          router.push({
            pathname: '/[projectId]/photos/showImage',
            params: { projectId, uri, projectName, photoDate: dateString },
          });
        }
      }
    },
    [orgId, projectId, playVideo, router, getImage, projectName],
  );

  const onRemove = useCallback(async () => {
    const selectedIds = mediaItems
      .filter((media) => media.isSelected)
      .map((media) => ({ id: media.id, imageId: media.imageId, mediaType: media.mediaType }));
    Alert.alert('Remove Photos', 'Are you sure you want to remove these photos from this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: async () => {
          const selectedImageIds = selectedIds.map((item) => item.imageId).filter((id): id is string => !!id);

          // Use Set for O(1) lookup performance
          const selectedIdsSet = new Set(selectedImageIds);

          // Check which images are in the mediaToUpload queue
          const imagesInQueue = mediaToUpload.filter((upload) => selectedIdsSet.has(upload.itemId));

          // Remove images from mediaToUpload queue
          if (imagesInQueue.length > 0 && store) {
            console.log(`Removing ${imagesInQueue.length} images from mediaToUpload queue`);
            imagesInQueue.forEach((upload) => {
              store.delRow('mediaToUpload', upload.id);
            });
          }

          // Get images that need to be deleted from server (not in queue)
          // Use Set for O(1) lookup performance
          const imageQueueSet = new Set(imagesInQueue.map((upload) => upload.itemId));
          const imagesToDeleteFromServer = selectedImageIds.filter((id) => !imageQueueSet.has(id));

          // If there are images to delete from server, use the delete callback
          if (imagesToDeleteFromServer.length > 0) {
            const status = await deleteMediaCallback(projectId, imagesToDeleteFromServer, 'photo/video');
            if (!status.success) {
              Alert.alert('Error', status.msg);
              return;
            }
          }

          // Remove from local store and delete local files
          for (const uId of selectedIds) {
            removePhotoData(uId.id);

            // Delete the local media file
            if (uId.imageId && orgId) {
              await deleteLocalMediaFile(orgId, projectId, uId.imageId, uId.mediaType, 'photo');
            }
          }
        },
      },
    ]);
  }, [removePhotoData, mediaItems, projectId, orgId, deleteMediaCallback, store, mediaToUpload]);

  const updateMediaItemsOnServer = useCallback(
    async (publicImageIds: ImageIdAndType[]) => {
      if (publicImageIds.length === 0) {
        setPublicStateForSelectedMedia(projectId, []);
      } else {
        setPublicStateForSelectedMedia(projectId, publicImageIds);
      }
    },
    [projectId, setPublicStateForSelectedMedia],
  );

  const onToggleAccess = useCallback(() => {
    const selectedIds = new Set(mediaItems.filter((media) => media.isSelected).map((media) => media.id));
    if (selectedIds.size === 0) return;

    const publicImageIds: ImageIdAndType[] = [];

    // First, collect all non-selected public items
    mediaItems.forEach((item) => {
      if (!selectedIds.has(item.id) && item.isPublic && item.imageId) {
        publicImageIds.push({ imageId: item.imageId, mediaType: item.mediaType });
      }
    });

    // Then, toggle selected items and add those that will become public
    selectedIds.forEach((id) => {
      const item = mediaItems.find((media) => media.id === id);
      if (!item) return;
      const newPublicState = !item.isPublic;
      updateMediaEntry(id, { isPublic: newPublicState });

      // If the new public state is true, add to publicImageIds
      if (newPublicState && item.imageId) {
        publicImageIds.push({ imageId: item.imageId, mediaType: item.mediaType });
      }
    });

    // Call updateMediaItemsOnServer with the calculated public image IDs
    updateMediaItemsOnServer(publicImageIds);
  }, [mediaItems, updateMediaEntry, updateMediaItemsOnServer]);

  const renderItem = useCallback(
    ({ item, index }: { item: MediaEntryDisplayData; index: number }) => {
      const photoDate = formatDate(item.creationDate, undefined, true);
      return (
        <View style={[{ flex: 1 }, index % 2 ? { paddingLeft: 5 } : { paddingRight: 5 }, { paddingTop: 5 }]}>
          <TouchableOpacity
            style={[
              styles.imageContainer,
              { backgroundColor: colors.listBackground, borderColor: colors.listBackground },
              item.isSelected && styles.imageSelected,
            ]}
            onPress={() => handleSelection(item.id)}
            onLongPress={() => handleImageLongPress(item.imageId, item.mediaType, photoDate)}
          >
            <View style={styles.mediaContentContainer}>
              <Base64Image base64String={item.thumbnail} height={100} width={100} />
              <Text style={styles.dateOverlay}>{photoDate}</Text>
              {item.mediaType === 'video' && (
                <View style={styles.playButtonOverlay}>
                  <Ionicons name="play" size={30} color="white" />
                </View>
              )}
              {item.isPublic && (
                <View style={[styles.publicIconOverlay]}>
                  <Octicons name="globe" size={20} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleSelection, handleImageLongPress, colors],
  );

  return (
    <View style={styles.listColumn}>
      <View
        style={{
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text txtSize="title" style={styles.listTitle}>
          Project Photos/Videos
        </Text>
      </View>

      {mediaItems.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text txtSize="title">No Photos found.</Text>
          <Text txtSize="standard">Use menu button to import photos.</Text>
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
              <Text style={{ marginLeft: 10 }}>{hasSelectedItems ? 'Clear Selection' : 'Select All'}</Text>
            </TouchableOpacity>
            {hasSelectedItems && <Text>{`${selectedCount} selected`}</Text>}
          </View>

          <FlashList numColumns={showInSingleColumn ? 1 : 2} data={mediaItems} renderItem={renderItem} />

          {hasSelectedItems && (
            <View style={styles.buttonContainer}>
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <ActionButton title="Remove" onPress={onRemove} type="action" />
                </View>
                {isConnected && isInternetReachable && (
                  <View style={styles.buttonWrapper}>
                    <ActionButton
                      textStyle={{ textAlign: 'center' }}
                      title="Toggle Access"
                      onPress={onToggleAccess}
                      type="action"
                    />
                  </View>
                )}
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
    paddingVertical: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  selectRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    position: 'relative',
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
    borderWidth: 3,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 5, // Adjust as needed
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  listColumn: {
    flex: 1,
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
  publicIconOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 12,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
