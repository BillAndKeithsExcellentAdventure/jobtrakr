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
import Base64Image from '@/components/Base64Image';
import { createThumbnail } from '@/utils/thumbnailUtils';

interface MediaEntryDisplayData extends MediaEntryData {
  isSelected: boolean;
}

type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
};

let gAssetItems: AssetsItem[] = [];

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
  const [showAssetItems, setShowAssetItems] = useState<boolean>(false);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [useProjectLocation, setUseProjectLocation] = useState<boolean>(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loadingNearest, setLoadingNearest] = useState<boolean>(false);

  const [fetchStatus, setFetchStatus] = useState<string>('');

  const OnStatusUpdate = useCallback(
    (status: string) => {
      setFetchStatus(status);
    },
    [setFetchStatus],
  );

  /////////////////////////////////////////////////////////
  // Phone Photo Library Media
  /////////////////////////////////////////////////////////
  const [assetItems, setAssetItems] = useState<AssetsItem[] | undefined>(undefined);
  const [hasSelectedAssets, setHasSelectedAssets] = useState<boolean>(false);

  const LoadPhotosNearestToProject = useCallback(async () => {
    Alert.alert(
      'Find Pictures Near Project',
      "Press Ok to find pictures near the designated project's location. This may take a few minutes to process.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: async () => {
            setUseProjectLocation(false);
          },
        },
        {
          text: 'Ok',
          onPress: async () => {
            try {
              setLoadingNearest(true);
              const lat = 0; //currentProject?.latitude;
              const long = 0; //currentProject?.longitude;
              if (lat != 0 && long != 0) {
                setShowAssetItems(true); // Show the panel when assets are loaded
                const foundAssets: MediaLibrary.Asset[] | undefined =
                  await mediaTools.current?.getAllAssetsNearLocation(
                    long!,
                    lat!,
                    100, // Need to make this configurable
                    OnStatusUpdate,
                  );

                if (foundAssets) {
                  // Filter out assets that are already in projectAssets
                  const filteredAssets = foundAssets.filter(
                    (foundAsset) =>
                      !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
                  );

                  const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
                    _id: asset.id ?? '',
                    selected: true,
                    asset: asset,
                  }));

                  gAssetItems.length = 0;
                  gAssetItems = gAssetItems.concat(selectionList);
                  setAssetItems(gAssetItems);

                  const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
                  OnStatusUpdate(filteredStatus);
                }
              }
              setLoadingNearest(false);
            } catch (err) {
              alert('An error while finding pictures.');
            }
          },
        },
      ],
    );
  }, [allProjectMedia]);

  const LoadAllPhotos = useCallback(async () => {
    setShowAssetItems(true); // Show the panel when assets are loaded

    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getFirstAssetPage(100);
    console.log('Found x assets:', foundAssets?.length);

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems.length = 0;
      gAssetItems = gAssetItems.concat(selectionList);
      setAssetItems(gAssetItems);

      const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
      OnStatusUpdate(filteredStatus);
    }
  }, [allProjectMedia, assetItems]);

  const onLoadPhotosClicked = useCallback(
    async (useNewProjectLocation: boolean) => {
      if (useNewProjectLocation) {
        await LoadPhotosNearestToProject();
      } else {
        await LoadAllPhotos();
      }
    },
    [LoadPhotosNearestToProject, LoadAllPhotos],
  );

  const handleMenuItemPress = useCallback(
    (item: string) => {
      if (item === 'AddPhotos') {
        setUseProjectLocation(false);
        onLoadPhotosClicked(false);
        setShowAssetItems(true);
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
        const newPhoto: MediaEntryData = {
          id: '',
          assetId: asset.id, //imageAddResult.id ?? '',
          deviceName: 'Device Name', // TODO: Get the device name
          mediaType: 'photo',
          mediaUri: imageAddResult.uri ?? '',
          thumbnail: '',
          creationDate: Date.now(),
        };

        if (imageAddResult.uri && mediaTools.current) {
          newPhoto.thumbnail = (await createThumbnail(asset.uri, projectName, 200, 200)) ?? '';
        }

        const status = addPhotoData(newPhoto);
        console.log('Finished adding Photo.', status);
      }
    }
  };

  const OnLoadPhotosClicked = useCallback(
    async (useNewProjectLocation: boolean) => {
      if (useNewProjectLocation) {
        await LoadPhotosNearestToProject();
      } else {
        await LoadAllPhotos();
      }
    },
    [LoadPhotosNearestToProject, LoadAllPhotos],
  );

  const LoadMore = useCallback(async () => {
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getNextAssetPage();

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems = gAssetItems.concat(selectionList);
      setAssetItems(gAssetItems);
      const filteredStatus = `Added ${filteredAssets.length} assets into assetItems`;
      OnStatusUpdate(filteredStatus);
    }
  }, [allProjectMedia, assetItems]);

  const OnAddToProjectClicked = useCallback(async () => {
    if (assetItems) {
      for (const asset of assetItems) {
        if (!hasSelectedAssets || asset.selected) {
          console.log('Adding a new Photo.', asset.asset.uri);
          // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
          const imageAddResult = await addPhotoImage(asset.asset.uri, projectId, 'photo');
          console.log('Finished adding Photo.', imageAddResult);
          if (imageAddResult.status === 'Success') {
            let tn = '';
            if (imageAddResult.uri) {
              let tn = await createThumbnail(imageAddResult?.uri, projectName, 200, 200);
            }
            if (asset.asset.mediaType === 'photo' || asset.asset.mediaType === 'video') {
              const newPhoto: MediaEntryData = {
                id: '',
                assetId: imageAddResult.id ?? '',
                deviceName: 'Device Name', // TODO: Get the device name
                mediaType: asset.asset.mediaType,
                mediaUri: imageAddResult.uri ?? '',
                thumbnail: tn,
                creationDate: Date.now(),
              };

              const status = addPhotoData(newPhoto);
            }
          }
        }
      }

      setShowAssetItems(false); // Hide the panel after adding
      assetItems.length = 0; // Clear the assets
    }
  }, [assetItems, projectId, hasSelectedAssets]);

  const handleClose = useCallback(() => {
    setShowAssetItems(false);
    gAssetItems.length = 0;
    setAssetItems(gAssetItems);
  }, []);

  const handleAssetSelection = useCallback(async (assetId: string) => {
    setAssetItems((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  useEffect(() => {
    if (assetItems) {
      setHasSelectedAssets(assetItems.some((item) => item.selected));
    } else {
      setHasSelectedAssets(false);
    }
  }, [assetItems]);

  const getAddButtonTitle = useCallback(() => {
    if (!assetItems) return 'Add All';
    const hasSelectedAssets = assetItems.some((item) => item.selected);
    return hasSelectedAssets ? 'Add Selected' : 'Add All';
  }, [assetItems]);

  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        {!useProjectLocation && <Button title="Load More" onPress={LoadMore}></Button>}
      </View>
    );
  };

  const onAssetAllOrClearChanged = useCallback(async () => {
    if (hasSelectedAssets) {
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)));
    } else {
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [assetItems, hasSelectedAssets]);

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
      if (asset && mediaTools.current) {
        const tn = await createThumbnail(asset.mediaUri, projectName, 100, 100);
        if (tn) {
          setThumbnail(tn);
        }
      }
    }
  }, [selectableProjectMedia]);

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
              {selectableProjectMedia.length === 0 ? (
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
                            name={
                              selectableProjectMedia.some((media) => media.isSelected)
                                ? 'ellipse-sharp'
                                : 'ellipse-outline'
                            }
                            size={24}
                            color={colors.iconColor}
                            style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                      <Text>
                        {!showAssetItems
                          ? selectableProjectMedia.some((media) => media.isSelected)
                            ? 'Clear Selection'
                            : 'Select All'
                          : ''}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      {selectableProjectMedia.some((media) => media.isSelected) && (
                        <Text
                          style={{ alignSelf: 'center' }}
                          text={`${selectedProjectMediaCount} selected`}
                        />
                      )}
                    </View>
                  </View>
                  <FlashList
                    numColumns={showAssetItems ? 1 : 2}
                    data={selectableProjectMedia}
                    estimatedItemSize={200}
                    renderItem={({ item }) => {
                      const photoDate = formatDate(item.creationDate);
                      return (
                        <View style={styles.imageContainer}>
                          <TouchableOpacity
                            style={[styles.imageContainer, item.isSelected && styles.imageSelected]}
                            onPress={() => handleProjectAssetSelection(item.id)}
                            onLongPress={() => handleImagePress(item.mediaUri, item.mediaType, photoDate)}
                          >
                            <View
                              style={{
                                alignItems: 'center',
                                alignContent: 'center',
                                justifyContent: 'center',
                              }}
                            >
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
                    }}
                  />
                  <View style={styles.buttonContainer}>
                    {selectableProjectMedia.some((media) => media.isSelected) && (
                      <View style={styles.buttonRow}>
                        <View style={styles.buttonWrapper}>
                          <ActionButton title="Remove" onPress={removeFromProjectClicked} type={'action'} />
                        </View>
                        {getSelectedIds().length === 1 && (
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
            {showAssetItems && (
              <>
                <View style={styles.separator} />
                <View style={styles.listColumn}>
                  <Text style={styles.listTitle}>Photos</Text>
                  {loadingNearest ? (
                    <View style={styles.loadingContainer}>
                      <Text>Loading...{fetchStatus}</Text>
                      <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.selectRow}>
                        <Pressable
                          onPress={() => {
                            onAssetAllOrClearChanged();
                          }}
                        >
                          {({ pressed }) => (
                            <Ionicons
                              name={hasSelectedAssets ? 'ellipse-sharp' : 'ellipse-outline'}
                              size={24}
                              color={colors.iconColor}
                              style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                            />
                          )}
                        </Pressable>

                        {hasSelectedAssets && (
                          <Text style={{ alignSelf: 'center' }}>
                            {assetItems?.filter((asset) => asset.selected).length} selected
                          </Text>
                        )}
                      </View>
                      <FlashList
                        data={assetItems}
                        estimatedItemSize={200}
                        ListFooterComponent={renderFooter}
                        renderItem={({ item }) => {
                          const photoDate = new Date(item.asset.creationTime * 1).toLocaleString();
                          return (
                            <View style={styles.assetContainer}>
                              <TouchableOpacity
                                style={[styles.imageContainer, item.selected && styles.imageSelected]}
                                onPress={() => handleAssetSelection(item.asset.id)}
                                onLongPress={() =>
                                  handleImagePress(
                                    item.asset.uri,
                                    item.asset.mediaType as 'photo' | 'video',
                                    photoDate,
                                  )
                                }
                              >
                                <View>
                                  <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
                                  <Text style={styles.dateOverlay}>{photoDate}</Text>
                                  {item.asset.mediaType === 'video' && (
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
                        <View style={styles.buttonRow}>
                          {(useProjectLocation || (!useProjectLocation && hasSelectedAssets)) && (
                            <View style={styles.buttonWrapper}>
                              <ActionButton
                                type={'action'}
                                title={getAddButtonTitle()}
                                onPress={OnAddToProjectClicked}
                              />
                            </View>
                          )}
                          <View style={styles.buttonWrapper}>
                            <ActionButton title="Close" onPress={handleClose} type={'action'} />
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </View>
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

/* OLD CODE NOT USED
  const createPictureBucketDataArray = (assets: AssetsItem[]) => {
    return assets
      .filter((asset) => asset.selected)
      .map((asset) => ({
        _id: asset._id,
        asset: asset.asset,
      }));
  };

  const OnShareProjectPhotosClicked = useCallback(async () => {
    if (projectAssets) {
      const assets = createPictureBucketDataArray(projectAssets);
      try {
        const paths = assets.map((asset) => asset.asset.uri);
        await ShareFiles(paths);
      } catch (error) {
        console.error(`Error creating/sharing file: ${error}`);
      }
    }
  }, [projectAssets]);

  */
