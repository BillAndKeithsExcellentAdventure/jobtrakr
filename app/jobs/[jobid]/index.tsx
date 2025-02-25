import EditJobModalScreen from '@/app/(modals)/EditJobModalScreen';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet } from 'react-native';

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
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && jobId) setEditJobId(jobId);
    },
    [jobId],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
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
          handleMenuItemPress('Delete', actionContext);
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
                  title="Job Overview"
                  headerLeft={() => (
                    <Pressable
                      onPress={() => {
                        router.back();
                      }}
                    >
                      {({ pressed }) => (
                        <MaterialCommunityIcons
                          name="arrow-left"
                          size={24}
                          color={colors.iconColor}
                          style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                        />
                      )}
                    </Pressable>
                  )}
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
              title: 'Job Overview',
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
      <RightHeaderMenu
        modalVisible={headerMenuModalVisible}
        setModalVisible={setHeaderMenuModalVisible}
        buttons={rightHeaderMenuButtons}
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
