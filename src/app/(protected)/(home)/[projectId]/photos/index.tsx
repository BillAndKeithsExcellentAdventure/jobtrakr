import { ActionButton } from '@/src/components/ActionButton';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import ProjectCameraView from '@/src/components/CameraView';
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
import { StyleSheet } from 'react-native';
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
  }, [projectId]);

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

  const handlePhotoCaptured = useCallback(
    async (asset: MediaLibrary.Asset) => {
      if (!asset) return;

      const imageAddResult = await addPhotoImage(
        asset.uri,
        projectId,
        asset.mediaType === MediaLibrary.MediaType.photo ? 'photo' : 'video',
        'photo',
      );
      console.log('Image Add Result:', imageAddResult);
      if (imageAddResult.status === 'Success' && imageAddResult.uri) {
        const thumbnail = await createThumbnail(asset.uri);

        const newPhoto: MediaEntryData = {
          id: '',
          assetId: asset.id,
          deviceName: 'Device Name',
          imageId: imageAddResult.id,
          mediaType: asset.mediaType === MediaLibrary.MediaType.photo ? 'photo' : 'video',
          thumbnail: thumbnail ?? '',
          creationDate: Date.now(),
        };

        addPhotoData(newPhoto);
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
              type={'action'}
              title={'Take Picture / Video'}
              onPress={() => setIsCameraVisible(true)}
            />
          </View>
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
});

export default ProjectPhotosPage;
