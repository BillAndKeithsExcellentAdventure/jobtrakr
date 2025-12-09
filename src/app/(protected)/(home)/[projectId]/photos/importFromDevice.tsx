import { DeviceMediaList } from '@/src/components/DeviceMediaList';
import { Switch } from '@/src/components/Switch';
import { Text, View } from '@/src/components/Themed';

import { VideoPlayerModal } from '@/src/components/VideoPlayerModal';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useAllRows,
  useIsStoreAvailableCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ImportDevicePhotosPage = () => {
  const router = useRouter();

  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [useProjectLocation, setUseProjectLocation] = useState(false);
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
                allProjectMedia={allProjectMedia}
                onClose={() => router.back}
                playVideo={playVideo}
                useProjectLocation={useProjectLocation}
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
