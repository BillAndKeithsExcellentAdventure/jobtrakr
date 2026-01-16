import { ActionButton } from '@/src/components/ActionButton';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import { ProjectCameraView, CapturedMedia } from '@/src/components/CameraView';
import { ProjectMediaList } from '@/src/components/ProjectMediaList';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { Text, View } from '@/src/components/Themed';
import { VideoPlayerModal } from '@/src/components/VideoPlayerModal';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import {
  MediaEntryData,
  RecentMediaEntryDateCompare,
  useAddRowCallback,
  useAllRows,
  useIsStoreAvailableCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { Entypo, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProjectPhotosPage = () => {
  const router = useRouter();
  const colors = useColors();

  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  const addPhotoImage = useAddImageCallback();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // Memoize the permission check callback
  const checkPermissions = useCallback(async () => {
    if (permissionResponse?.status !== 'granted') {
      await requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const allProjectMedia = useAllRows(projectId, 'mediaEntries', RecentMediaEntryDateCompare);
  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const handlePhotoCaptured = useCallback(
    async (media: CapturedMedia) => {
      setIsPhotoUploading(true);
      console.log(`[handlePhotoCaptured] START - media.id: ${media?.id}, projectId: ${projectId}`);

      try {
        if (!media) {
          console.warn('[handlePhotoCaptured] No media provided');
          return;
        }

        console.log(`[handlePhotoCaptured] Calling addPhotoImage with uri: ${media.uri}`);
        const imageAddResult = await addPhotoImage(
          media.uri,
          projectId,
          media.mediaType,
          'photo',
        );
        console.log('[handlePhotoCaptured] Image Add Result:', JSON.stringify(imageAddResult, null, 2));

        if (imageAddResult.status === 'Success') {
          console.log(`[handlePhotoCaptured] Status is Success. uri: ${imageAddResult.uri}`);

          if (imageAddResult.uri) {
            console.log(`[handlePhotoCaptured] URI is present. Creating thumbnail from: ${media.uri}`);
            const thumbnail = await createThumbnail(media.uri);
            console.log(`[handlePhotoCaptured] Thumbnail created: ${thumbnail ? 'yes' : 'no'}`);

            const newPhoto: MediaEntryData = {
              id: '',
              assetId: media.id,
              deviceName: 'Device Name',
              imageId: imageAddResult.id,
              mediaType: media.mediaType,
              thumbnail: thumbnail ?? '',
              creationDate: Date.now(),
              isPublic: false,
            };

            console.log(
              `[handlePhotoCaptured] Adding to projectDetails store with imageId: ${imageAddResult.id}`,
            );
            addPhotoData(newPhoto);
            console.log(`[handlePhotoCaptured] Successfully added to store`);
          } else {
            console.warn('[handlePhotoCaptured] Status is Success but uri is missing!');
          }
        } else {
          console.error('[handlePhotoCaptured] Status is not Success:', imageAddResult.msg);
        }
      } catch (err) {
        console.error('[handlePhotoCaptured] Error while handling captured media', err);
      } finally {
        setIsPhotoUploading(false);
      }
    },
    [projectId, addPhotoImage, addPhotoData],
  );

  const [showDeviceAssets, setShowDeviceAssets] = useState<boolean>(false);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const playVideo = (videoUri: string) => {
    setSelectedVideo(videoUri);
    setIsVideoPlayerVisible(true);
  };

  const handleMenuItemPress = useCallback(
    (item: string) => {
      if (item === 'AddPhotos') {
        setHeaderMenuModalVisible(false);
        router.push({ pathname: '/[projectId]/photos/importFromDevice', params: { projectId, projectName } });
      } else if (item === 'ManageAccess') {
        setHeaderMenuModalVisible(false);
        router.push({ pathname: '/[projectId]/photos/manageAccess', params: { projectId, projectName } });
      }
    },
    [router, projectId, projectName, setHeaderMenuModalVisible],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Import Photos',
        onPress: () => {
          handleMenuItemPress('AddPhotos');
        },
      },
      {
        icon: <Ionicons name="ribbon-outline" size={28} color={colors.iconColor} />,
        label: 'Manage Photo Access',
        onPress: () => {
          handleMenuItemPress('ManageAccess');
        },
      },
    ],
    [colors, handleMenuItemPress],
  );

  const handleDeviceMediaClose = useCallback(() => {
    setShowDeviceAssets(false);
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: projectName,
          headerRight: () => (
            <Pressable
              onPress={() => {
                setHeaderMenuModalVisible(!headerMenuModalVisible);
              }}
            >
              {({ pressed }) => (
                <Ionicons
                  name="menu-outline"
                  size={24}
                  color={colors.iconColor}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />

      {!projectIsReady ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <View style={styles.headerInfo}>
            <ActionButton
              style={{ alignSelf: 'stretch' }}
              type="action"
              title="Take Picture / Video"
              onPress={() => setIsCameraVisible(true)}
            />
          </View>
          {isPhotoUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.iconColor} />
              <Text style={styles.uploadingText}>Uploading photo...</Text>
            </View>
          )}
          <View style={styles.listsContainer}>
            <ProjectMediaList
              projectId={projectId}
              projectName={projectName}
              showInSingleColumn={showDeviceAssets}
              projectMediaItems={allProjectMedia}
              playVideo={playVideo}
            />
          </View>
        </>
      )}
      {headerMenuModalVisible && (
        <RightHeaderMenu
          modalVisible={headerMenuModalVisible}
          setModalVisible={setHeaderMenuModalVisible}
          buttons={rightHeaderMenuButtons}
        />
      )}
      {selectedVideo && (
        <VideoPlayerModal
          isVisible={isVideoPlayerVisible}
          videoUri={selectedVideo}
          onClose={() => setIsVideoPlayerVisible(false)}
        />
      )}
      {isCameraVisible && (
        <ProjectCameraView
          visible={isCameraVisible}
          projectName={projectName}
          projectId={projectId}
          onMediaCaptured={handlePhotoCaptured}
          onClose={() => setIsCameraVisible(false)}
        ></ProjectCameraView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    margin: 10,
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadingText: {
    marginLeft: 8,
  },
});

export default ProjectPhotosPage;
