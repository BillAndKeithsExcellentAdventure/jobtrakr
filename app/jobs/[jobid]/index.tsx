import { StyleSheet, SafeAreaView, Pressable, Platform } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { Text, View } from '@/components/Themed';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ScreenHeader';
import JobIdHeaderMenu from './JobIdHeaderMenu';
import { ActionButtonProps } from '@/components/ButtonBar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import EditJobModalScreen from '@/app/(modals)/EditJobModalScreen';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';

type Job = {
  jobId?: string;
  name: string;
  location?: string;
  owner?: string;
  finishDate?: Date;
  startDate?: Date;
  bidPrice?: number;
  longitude?: number;
  latitude?: number;
};

const JobCategoriesPage = () => {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colorScheme = useColorScheme();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [editJobId, setEditJobId] = useState<string | undefined>();
  const { jobDbHost } = useJobDb();
  const [job, setJob] = useState<Job>({
    jobId,
    name: '',
    location: '',
    owner: '',
    startDate: undefined,
    finishDate: undefined,
    bidPrice: 0,
    longitude: undefined,
    latitude: undefined,
  });

  // Define colors based on the color scheme (dark or light)
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

  const loadJobData = useCallback(async () => {
    const result = await jobDbHost?.GetJobDB().FetchJobById(jobId);
    const fetchedJob = result ? result.job : undefined;
    if (!!fetchedJob) {
      const fetchedJobData: Job = {
        ...job,
        name: fetchedJob.Name,
        location: fetchedJob.Location,
        owner: fetchedJob.OwnerName,
        bidPrice: fetchedJob.BidPrice,
        longitude: fetchedJob.Longitude,
        latitude: fetchedJob.Latitude,
      };

      setJob(fetchedJobData);
    }
  }, [jobDbHost, jobId]);

  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      console.log('menu item pressed-', menuItem);
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && jobId) setEditJobId(jobId);
    },
    [jobId],
  );

  const buttons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="edit" size={28} color={colors.iconColor} />,
        label: 'Edit Job Info',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Edit', actionContext);
        },
      },
      {
        icon: <FontAwesome name="trash" size={28} color={colors.iconColor} />,
        label: 'Delete Job',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Edit', actionContext);
        },
      },
    ],
    [colors],
  );

  const hideEditJobModal = useCallback(
    (success: boolean) => {
      setEditJobId(undefined);
      if (success) loadJobData();
    },
    [loadJobData],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {Platform.OS === 'android' ? (
          <Stack.Screen
            options={{
              headerShown: true,
              header: () => (
                <ScreenHeader
                  title="Job Details"
                  headerRight={() => (
                    <Pressable
                      onPress={() => {
                        setHeaderMenuModalVisible(!headerMenuModalVisible);
                      }}
                    >
                      {({ pressed }) => (
                        <MaterialCommunityIcons
                          name="menu"
                          size={28}
                          color={colors.iconColor}
                          style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                        />
                      )}
                    </Pressable>
                  )}
                />
              ),
            }}
          />
        ) : (
          <Stack.Screen
            options={{
              headerShown: true,
              title: 'Job Details',
              headerRight: () => (
                <Pressable
                  style={{ marginRight: 12 }}
                  onPress={() => {
                    setHeaderMenuModalVisible(!headerMenuModalVisible);
                  }}
                >
                  {({ pressed }) => (
                    <MaterialCommunityIcons
                      name="menu"
                      size={28}
                      color={colors.iconColor}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              ),
            }}
          />
        )}

        <View style={styles.headerContainer}>
          <Text>JobName={job.name}</Text>
          <Text>JobId={jobId}</Text>
        </View>
      </View>
      <JobIdHeaderMenu
        modalVisible={headerMenuModalVisible}
        setModalVisible={setHeaderMenuModalVisible}
        buttons={buttons}
      />
      <EditJobModalScreen jobId={editJobId} hideModal={hideEditJobModal} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default JobCategoriesPage;
