import { ActionButton } from '@/components/ActionButton';
import { Switch } from '@/components/Switch';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import {
  MediaEntryData,
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import ProjectCameraView from '@/app/(modals)/CameraView';
import { useAddImageCallback } from '@/utils/images';
import { FlashList } from '@shopify/flash-list';
import { formatDate } from '@/utils/formatters';
import { MediaAssetsHelper } from '@/utils/mediaAssetsHelper';
import { useProjectValue } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export async function createThumbnail(
  uri: string,
  jobName: string,
  width: number,
  height: number,
): Promise<string | undefined> {
  let thumbnailUrlInBase64: string | undefined = undefined;

  try {
    let thumbnailUri: string | undefined = undefined;

    // Copy the original image
    thumbnailUri = `${FileSystem.documentDirectory}Thumbnail_${jobName}.jpg`;
    console.log(`Creating thumbnail for ${uri}...`);
    console.log(`   by copying file to for ${thumbnailUri}...`);

    await FileSystem.copyAsync({
      from: uri,
      to: thumbnailUri,
    });

    // Manipulate the copied image to create a thumbnail
    const manipulationContext = await ImageManipulator.ImageManipulator.manipulate(thumbnailUri);

    manipulationContext.resize({ width: width, height: height });

    thumbnailUrlInBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (thumbnailUrlInBase64) {
      await FileSystem.deleteAsync(thumbnailUri);
    }
  } catch (error) {
    console.error(`Error creating thumbnail: ${error}`);
    thumbnailUrlInBase64 = undefined;
  }

  return thumbnailUrlInBase64;
}

const ProjectPhotosPage = () => {
  const mediaTools = useRef<MediaAssetsHelper | null>(null);

  useEffect(() => {
    if (mediaTools.current === null) {
      mediaTools.current = new MediaAssetsHelper();
    }
  }, []);

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
  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');
  const removePhotoData = useDeleteRowCallback(projectId, 'mediaEntries');
  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Add Photos',
        onPress: () => {
          handleMenuItemPress('AddPhotos');
        },
      },
    ],
    [colors],
  );
  const [showAssetItems, setShowAssetItems] = useState<boolean>(false);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [useProjectLocation, setUseProjectLocation] = useState<boolean>(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedProjectAssetIds, setSelectedProjectAssetIds] = useState<string[]>([]);

  const onLoadPhotosClicked = useCallback(async (useNewProjectLocation: boolean) => {
    /*
    if (useNewProjectLocation) {
      await LoadPhotosNearestToProject();
    } else {
      await LoadAllPhotos();
    }*/
  }, []);

  const handleMenuItemPress = useCallback(
    (item: string) => {
      if (item === 'AddPhotos') {
        setUseProjectLocation(false);
        onLoadPhotosClicked(false);
      }
      setHeaderMenuModalVisible(false);
    },
    [useProjectLocation, onLoadPhotosClicked],
  );

  const onSwitchValueChanged = useCallback(() => {
    const newValue = !useProjectLocation;
    setUseProjectLocation(newValue);
    onLoadPhotosClicked(newValue);
  }, [useProjectLocation, onLoadPhotosClicked]);

  const handlePhotoCaptured = async (asset: MediaLibrary.Asset) => {
    if (asset) {
      console.log('Adding a new Photo.', asset.uri);
      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addPhotoImage(asset.uri, projectId, 'photo');
      console.log('Finished adding Photo.', imageAddResult);
      if (imageAddResult.status === 'Success') {
        let tn = '';
        if (imageAddResult.uri && mediaTools.current) {
          let tn = await createThumbnail(imageAddResult.uri, projectName, 100, 100);
        }

        const newPhoto: MediaEntryData = {
          id: '',
          assetId: imageAddResult.id ?? '',
          deviceName: 'Device Name', // TODO: Get the device name
          mediaType: 'photo',
          mediaUri: imageAddResult.uri ?? '',
          thumbnail: tn,
          creationDate: Date.now(),
        };

        const status = addPhotoData(newPhoto);
        console.log('Finished adding Photo.', status);
      }
    }
  };

  const handleProjectAssetSelection = useCallback(
    async (id: string) => {
      // if the id is already in the selectedProjectAssetIds array, remove it, otherwise add it
      if (selectedProjectAssetIds.includes(id)) {
        setSelectedProjectAssetIds((prevAssets) => prevAssets.filter((item) => item !== id));
      } else {
        setSelectedProjectAssetIds((prevAssets) => [...prevAssets, id]);
      }
    },
    [selectedProjectAssetIds],
  );

  const removeFromProjectClicked = useCallback(async () => {
    Alert.alert('Remove Photos', 'Are you sure you want to remove these photos from this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          for (const uId of selectedProjectAssetIds) {
            removePhotoData(uId);
          }
          setSelectedProjectAssetIds([]);
        },
      },
    ]);
  }, [removePhotoData, projectId]);

  const playVideo = (videoUri: string) => {
    setSelectedVideo(videoUri);
    setIsVideoPlayerVisible(true);
  };

  const onProjectAllOrClearChanged = useCallback(() => {
    if (selectedProjectAssetIds.length > 0) {
      setSelectedProjectAssetIds([]);
    } else {
      const allIds = allProjectMedia.map((m) => m.id);
      setSelectedProjectAssetIds(allIds);
    }
  }, [selectedProjectAssetIds, allProjectMedia]);

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
    if (selectedProjectAssetIds.length === 1) {
      const asset = allProjectMedia.find((asset) => asset.id === selectedProjectAssetIds[0]);
      if (asset && mediaTools.current) {
        const tn = await createThumbnail(asset.mediaUri, projectName, 100, 100);
        if (tn) {
          setThumbnail(tn);
        }
      }
    }
  }, [selectedProjectAssetIds, allProjectMedia]);

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
            {!showAssetItems && (
              <ActionButton
                style={{ alignSelf: 'stretch', marginTop: 5 }}
                type={'action'}
                title={'Take Picture / Video'}
                onPress={() => setIsCameraVisible(true)}
              />
            )}
            {showAssetItems && (
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
                <Switch value={useProjectLocation} onValueChange={onSwitchValueChanged} size="large" />
                <Text text="Near Project" txtSize="standard" style={{ marginLeft: 10 }} />
              </View>
            )}
          </View>
          <View style={styles.listsContainer}>
            <View style={styles.listColumn}>
              <View style={{ alignItems: 'center' }}>
                <Text txtSize="title" style={styles.listTitle}>
                  Project Photos
                </Text>
                <Text txtSize="sub-title" style={{ marginLeft: 10 }}>
                  {`Project contains ${allProjectMedia.length} pictures.`}
                </Text>
              </View>
              {allProjectMedia.length === 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <Text>Use menu button to add photos.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable
                        onPress={() => {
                          onProjectAllOrClearChanged();
                        }}
                      >
                        {({ pressed }) => (
                          <Ionicons
                            name={selectedProjectAssetIds.length > 0 ? 'ellipse-sharp' : 'ellipse-outline'}
                            size={24}
                            color={colors.iconColor}
                            style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                      <Text>
                        {!showAssetItems
                          ? selectedProjectAssetIds.length > 0
                            ? 'Clear Selection'
                            : 'Select All'
                          : ''}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      {selectedProjectAssetIds.length > 0 && (
                        <Text
                          style={{ alignSelf: 'center' }}
                          text={`${selectedProjectAssetIds.length} selected`}
                        />
                      )}
                    </View>
                  </View>
                  <FlashList
                    numColumns={showAssetItems ? 1 : 2}
                    data={allProjectMedia}
                    estimatedItemSize={200}
                    renderItem={({ item }) => {
                      const photoDate = formatDate(item.creationDate);
                      return (
                        <View style={styles.imageContainer}>
                          <TouchableOpacity
                            style={[
                              styles.imageContainer,
                              selectedProjectAssetIds.includes(item.id) && styles.imageSelected,
                            ]}
                            onPress={() => handleProjectAssetSelection(item.id)}
                            onLongPress={() => handleImagePress(item.mediaUri, item.mediaType, photoDate)}
                          >
                            <View>
                              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
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
                    }}
                  />
                  <View style={styles.buttonContainer}>
                    {selectedProjectAssetIds.length > 0 && (
                      <View style={styles.buttonRow}>
                        <View style={styles.buttonWrapper}>
                          <ActionButton title="Remove" onPress={removeFromProjectClicked} type={'action'} />
                        </View>
                        {selectedProjectAssetIds.length === 1 && (
                          <View style={styles.buttonWrapper}>
                            <ActionButton
                              title="Thumbnail"
                              style={{ paddingHorizontal: 1 }}
                              onPress={setThumbnailClicked}
                              type={'action'}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
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
  listColumn: {
    flex: 1,
    padding: 10,
  },
  separator: {
    width: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
  listTitle: {
    textAlign: 'center',
  },
  thumbnail: {
    flex: 1,
    height: 200,
    borderRadius: 8,
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
    flex: 1, // This makes both buttons take up equal space
  },
  assetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxContainer: {
    marginRight: 10,
    borderWidth: 2,
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  imageSelected: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  footer: {
    padding: 10,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    flex: 1,
    marginBottom: 10,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: 5,
    borderRadius: 4,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  modalContent: {
    marginRight: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 150,
    elevation: 5, // To give the modal a slight shadow
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
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
});

export default ProjectPhotosPage;
