import { StyleSheet, Image, Button, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { Text, View } from '@/components/Themed';
import * as MediaLibrary from 'expo-media-library';
import { MediaAssets } from 'jobmedia';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';
import * as Location from 'expo-location';
import { FlashList } from '@shopify/flash-list';

const JobPhotosPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [jobAssets, setJobAssets] = useState<MediaLibrary.Asset[] | undefined>(undefined);
  const [nearAssets, setNearAssets] = useState<MediaLibrary.Asset[] | undefined>(undefined);
  const [mediaAssets, setMediaAssets] = useState<MediaAssets | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const { jobDbHost } = useJobDb();

  useEffect(() => {
    async function loadMedia(jobId: string) {
      const result = await jobDbHost?.GetPictureBucketDB().FetchJobAssets(jobId);
      console.log(`Fetched ${result?.assets?.length} assets for job ${jobName}`);
      if (result?.status === 'Success' && result && result.assets && result.assets.length > 0) {
        setJobAssets(result.assets);
      }
    }

    loadMedia(jobId);
  }, [jobId, jobDbHost]);

  useEffect(() => {
    async function loadMediaAssetsObj() {
      if (mediaAssets === null) {
        const ma = new MediaAssets();
        setMediaAssets(ma);
      }
    }

    loadMediaAssetsObj();
  }, []);

  useEffect(() => {
    async function getPermissions() {
      console.info('Initializing Media...');
      const response = await MediaLibrary.requestPermissionsAsync(true);
      if (response.status !== 'granted') {
        console.error('Permission to access media library was denied');
        return null;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return null;
      }
    }

    getPermissions();
  }, []);

  // Lets move this to a Utils file at some point.
  async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      let location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error(`Error getting current location: ${error}`);
      return null;
    }
  }

  const OnStatusUpdate = useCallback(
    (status: string) => {
      setFetchStatus(status);
    },
    [setFetchStatus],
  );

  const OnLoadNearestClicked = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      console.log(`Current location: ${location.latitude}, ${location.longitude}`);
      const foundAssets: MediaLibrary.Asset[] | undefined = await mediaAssets?.getAllAssetsNearLocation(
        location.longitude,
        location.latitude,
        100, // Need to make this configurable
        OnStatusUpdate,
      );
      console.log(`Found ${foundAssets ? foundAssets?.length : 0} pictures`);

      if (foundAssets) {
        // Filter out assets that are already in jobAssets
        const filteredAssets = foundAssets.filter(
          (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.id === foundAsset.id),
        );

        setNearAssets(filteredAssets);
        console.log(`Set ${filteredAssets.length} assets into nearAssets`);
      }
    }
  }, [mediaAssets, setNearAssets, jobAssets]);

  const OnAddAllToJobClicked = useCallback(async () => {
    if (nearAssets) {
      for (const asset of nearAssets) {
        await jobDbHost?.GetPictureBucketDB().InsertPicture(jobId, asset);
      }
    }
  }, [nearAssets, jobId]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Job Photos`, headerShown: true }} />
      <View style={styles.headerInfo}>
        <Text>JobName={jobName}</Text>
        <Text>JobId={jobId}</Text>
        <Button title="Load Nearest" onPress={OnLoadNearestClicked} />
      </View>
      <View style={styles.listsContainer}>
        {/* Left side - Job Assets */}
        <View style={styles.listColumn}>
          <Text style={styles.listTitle}>Job Photos</Text>
          {!jobAssets ? (
            <Text>No photos in job</Text>
          ) : (
            <FlashList
              data={jobAssets}
              estimatedItemSize={200}
              renderItem={(item) => <Image source={{ uri: item.item.uri }} style={styles.thumbnail} />}
            />
          )}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Right side - Near Assets */}
        <View style={styles.listColumn}>
          <Text style={styles.listTitle}>Nearby Photos</Text>
          {!nearAssets ? (
            <Text>Loading...{fetchStatus}</Text>
          ) : (
            <>
              <FlashList
                data={nearAssets}
                estimatedItemSize={200}
                renderItem={(item) => <Image source={{ uri: item.item.uri }} style={styles.thumbnail} />}
              />
              <Button title="Add All To Job" onPress={OnAddAllToJobClicked} />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    padding: 10,
    alignItems: 'center',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default JobPhotosPage;
