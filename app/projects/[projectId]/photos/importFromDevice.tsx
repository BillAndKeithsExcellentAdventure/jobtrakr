import ProjectCameraView from '@/app/(modals)/CameraView';
import { ActionButton } from '@/components/ActionButton';
import { ActionButtonProps } from '@/components/ButtonBar';
import { DeviceMediaList } from '@/components/DeviceMediaList';
import { ProjectMediaList } from '@/components/ProjectMediaList';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Switch } from '@/components/Switch';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { Colors } from '@/constants/Colors';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import {
  MediaEntryData,
  useAddRowCallback,
  useAllRows,
  useIsStoreAvailableCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/utils/images';
import { createThumbnail } from '@/utils/thumbnailUtils';
import { Entypo, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const ImportDevicePhotosPage = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [useProjectLocation, setUseProjectLocation] = useState(false);
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

  const allProjectMedia = useAllRows(projectId, 'mediaEntries');
  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');

  // Memoize handlePhotoCaptured to prevent unnecessary recreations
  const handlePhotoCaptured = useCallback(
    async (asset: MediaLibrary.Asset) => {
      if (!asset) return;

      const imageAddResult = await addPhotoImage(asset.uri, projectId, 'photo');

      if (imageAddResult.status === 'Success' && imageAddResult.uri) {
        const thumbnail = await createThumbnail(asset.uri);

        const newPhoto: MediaEntryData = {
          id: '',
          assetId: asset.id,
          deviceName: 'Device Name',
          mediaType: 'photo',
          mediaUri: imageAddResult.uri,
          thumbnail: thumbnail ?? '',
          creationDate: Date.now(),
        };

        addPhotoData(newPhoto);
      }
    },
    [projectId, projectName, addPhotoImage, addPhotoData],
  );

  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const playVideo = (videoUri: string) => {
    setSelectedVideo(videoUri);
    setIsVideoPlayerVisible(true);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Import photos from device',
        }}
      />

      {!projectIsReady ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <View style={styles.headerInfo}>
            <View
              style={{
                marginTop: 5,
                marginBottom: 5,
                alignSelf: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <Text text="Filter:" txtSize="standard" style={{ marginRight: 10 }} />
              <Text text="All" txtSize="standard" style={{ marginRight: 10 }} />
              <Switch
                value={useProjectLocation}
                onValueChange={() => setUseProjectLocation(!useProjectLocation)}
                size="large"
              />
              <Text text="Near Project" txtSize="standard" style={{ marginLeft: 10 }} />
            </View>
          </View>
          <View style={styles.listsContainer}>
            <>
              <View style={styles.separator} />
              <DeviceMediaList
                projectId={projectId}
                projectName={projectName}
                useProjectLocation={useProjectLocation}
                allProjectMedia={allProjectMedia}
                onClose={() => router.back}
                playVideo={playVideo}
                setUseProjectLocation={setUseProjectLocation}
              />
            </>
          </View>
        </>
      )}
      {selectedVideo && (
        <VideoPlayerModal
          isVisible={isVideoPlayerVisible}
          videoUri={selectedVideo}
          onClose={() => setIsVideoPlayerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  separator: {
    width: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
});

export default ImportDevicePhotosPage;
