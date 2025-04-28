import ProjectCameraView from '@/app/(modals)/CameraView';
import { ActionButton } from '@/components/ActionButton';
import { ActionButtonProps } from '@/components/ButtonBar';
import { DeviceMediaList } from '@/components/DeviceMediaList';
import { MediaEntryDisplayData, ProjectMediaList } from '@/components/ProjectMediaList';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Switch } from '@/components/Switch';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { Colors } from '@/constants/Colors';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useProjectValue } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import {
  MediaEntryData,
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/utils/images';
import { createThumbnail } from '@/utils/thumbnailUtils';
import { Entypo, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProjectPhotosPage = () => {
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
  const [, setThumbnail] = useProjectValue(projectId, 'thumbnail');
  const router = useRouter();
  const addPhotoImage = useAddImageCallback();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const handleMenuItemPress = useCallback((item: string) => {
    if (item === 'AddPhotos') {
      setShowDeviceAssets(true);
    }
    setHeaderMenuModalVisible(false);
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      console.info('Checking media permissions');
      if (permissionResponse) {
        console.info(`Permission status: ${permissionResponse.status}`);
        if (permissionResponse.status !== 'granted') {
          console.info('Requesting media permissions...');
          await requestPermission();
          console.info('Media permissions requested');
        }
      }
    };

    checkPermissions();
  }, [permissionResponse, requestPermission]);

  const allProjectMedia = useAllRows(projectId, 'mediaEntries');
  const [selectableProjectMedia, setSelectableProjectMedia] = useState<MediaEntryDisplayData[]>([]);

  useEffect(() => {
    // Initialize selectableProjectMedia whenever allProjectMedia changes
    setSelectableProjectMedia(allProjectMedia.map((m) => ({ ...m, isSelected: false })));
  }, [allProjectMedia]);

  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');
  const removePhotoData = useDeleteRowCallback(projectId, 'mediaEntries');

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
    [colors],
  );
  const [showDeviceAssets, setShowDeviceAssets] = useState<boolean>(false);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  /////////////////////////////////////////////////////////
  // Project Media
  /////////////////////////////////////////////////////////
  const selectedProjectMediaCount = useMemo(
    () => selectableProjectMedia.filter((media) => media.isSelected).length,
    [selectableProjectMedia],
  );

  const handleProjectAssetSelection = useCallback(async (id: string) => {
    setSelectableProjectMedia((prevMedia) =>
      prevMedia.map((media) => (media.id === id ? { ...media, isSelected: !media.isSelected } : media)),
    );
  }, []);

  const removeFromProjectClicked = useCallback(async () => {
    const selectedIds = selectableProjectMedia.filter((media) => media.isSelected).map((media) => media.id);
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
  }, [removePhotoData]);

  const playVideo = (videoUri: string) => {
    setSelectedVideo(videoUri);
    setIsVideoPlayerVisible(true);
  };

  const onProjectAllOrClearChanged = useCallback(() => {
    const hasSelectedItems = selectableProjectMedia.some((media) => media.isSelected);
    setSelectableProjectMedia((prevMedia) =>
      prevMedia.map((media) => ({
        ...media,
        isSelected: !hasSelectedItems,
      })),
    );
  }, [selectableProjectMedia]);

  const getSelectedIds = useCallback(() => {
    return selectableProjectMedia.filter((media) => media.isSelected).map((media) => media.id);
  }, [selectableProjectMedia]);

  const handleImagePress = useCallback((uri: string, type: 'video' | 'photo', photoDate: string) => {
    if (type === 'video') {
      playVideo(uri);
    } else if (type === 'photo') {
      console.log(`photoDate=${photoDate}`);
      const dateString = photoDate ?? 'No Date Info Available';
      router.push(
        `/projects/${projectId}/photos/showImage/?uri=${uri}&projectName=${projectName}&photoDate=${dateString}`,
      );
    }
  }, []);

  const setThumbnailClicked = useCallback(async () => {
    const selectedIds = selectableProjectMedia.filter((media) => media.isSelected).map((media) => media.id);
    if (selectedIds.length === 1) {
      const asset = selectableProjectMedia.find((asset) => asset.id === selectedIds[0]);
      if (asset) {
        const tn = await createThumbnail(asset.mediaUri, projectName, 100, 100);
        if (tn) {
          setThumbnail(tn);
        }
      }
    }
  }, [selectableProjectMedia]);

  const handlePhotoCaptured = async (asset: MediaLibrary.Asset) => {
    if (asset) {
      console.log('Adding a new Photo.', asset.uri);
      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addPhotoImage(asset.uri, projectId, 'photo');
      console.log('Finished adding Photo.', imageAddResult);
      if (imageAddResult.status === 'Success') {
        const newPhoto: MediaEntryData = {
          id: '',
          assetId: asset.id, //imageAddResult.id ?? '',
          deviceName: 'Device Name', // TODO: Get the device name
          mediaType: 'photo',
          mediaUri: imageAddResult.uri ?? '',
          thumbnail: '',
          creationDate: Date.now(),
        };

        if (imageAddResult.uri) {
          newPhoto.thumbnail = (await createThumbnail(asset.uri, projectName, 200, 200)) ?? '';
        }

        const status = addPhotoData(newPhoto);
        console.log('Finished adding Photo.', status);
      }
    }
  };

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
            {!showDeviceAssets && (
              <ActionButton
                style={{ alignSelf: 'stretch', marginTop: 5 }}
                type={'action'}
                title={'Take Picture / Video'}
                onPress={() => setIsCameraVisible(true)}
              />
            )}
            {showDeviceAssets && (
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
            )}
          </View>
          <View style={styles.listsContainer}>
            <ProjectMediaList
              mediaItems={selectableProjectMedia}
              onSelectItem={handleProjectAssetSelection}
              onImagePress={handleImagePress}
              onSelectAll={onProjectAllOrClearChanged}
              onRemove={removeFromProjectClicked}
              onSetThumbnail={setThumbnailClicked}
              showDeviceAssets={showDeviceAssets}
            />

            {showDeviceAssets && (
              <>
                <View style={styles.separator} />
                <DeviceMediaList
                  projectId={projectId}
                  projectName={projectName}
                  useProjectLocation={useProjectLocation}
                  allProjectMedia={allProjectMedia}
                  onClose={handleDeviceMediaClose}
                  playVideo={playVideo}
                  setUseProjectLocation={setUseProjectLocation}
                />
              </>
            )}
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
          showPreview={false}
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

export default ProjectPhotosPage;
