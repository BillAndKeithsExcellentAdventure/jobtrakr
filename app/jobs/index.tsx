import { ActionButtonProps } from '@/components/ButtonBar';
import { View, Text } from '@/components/Themed';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { router, Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useJobDb } from '@/context/DatabaseContext';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobDataStore } from '@/stores/jobDataStore';
import { useVendorDataStore, VendorEntry } from '@/stores/vendorDataStore';
import { ShareFile } from '@/utils/sharing';
import { useDbLogger } from '@/context/LoggerContext';
import { Pressable } from 'react-native-gesture-handler';

function MaterialDesignTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function isEntry(obj: any): obj is TwoColumnListEntry {
  return typeof obj.primaryTitle === 'string' && typeof obj.secondaryTitle === 'string';
}

export default function JobHomeScreen() {
  const { allJobs, updateJob, setAllJobs } = useJobDataStore();
  const { setVendorData } = useVendorDataStore();
  const [jobListEntries, setJobListEntries] = useState<TwoColumnListEntry[]>([]);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const navigation = useNavigation();
  const { jobDbHost } = useJobDb();
  const { logInfo, shareLogFile } = useDbLogger();
  const colorScheme = useColorScheme();

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

  const loadJobs = useCallback(async () => {
    const today = new Date();
    const result = await jobDbHost?.GetJobDB().FetchAllJobs();
    console.log('Fetched jobs:', result?.status);
    const jobs = result ? result.jobs : [];
    setAllJobs(jobs); // update the jobDataStore
  }, [jobDbHost]);

  // set the vendor data on initial screen render
  useEffect(() => {
    const vendorOptions: VendorEntry[] = [
      { label: 'Home Depot', _id: '1' },
      { label: "Lowe's", _id: '2' },
      { label: 'Tractor Supply', _id: '3' },
      { label: 'Master Plumbing', _id: '4' },
      { label: 'Ace Hardware', _id: '5' },
      { label: 'Johnson Fence', _id: '6' },
    ];

    setVendorData(vendorOptions);
  }, [allJobs]);

  useEffect(() => {
    if (allJobs) {
      const listData: TwoColumnListEntry[] = allJobs.map((job) => {
        return {
          primaryTitle: job.Name ? job.Name : 'unknown',
          isFavorite: undefined !== job.Favorite ? job.Favorite > 0 : false,
          entryId: job._id ?? '1',
          imageUri: job.Thumbnail ?? 'x',
          secondaryTitle: job.Location,
          tertiaryTitle: job.OwnerName ?? 'Owner',
          lines: [
            {
              left: `start: ${formatDate(job.StartDate)}`,
              right: `due: ${formatDate(job.PlannedFinish)}`,
            },
            {
              left: `bid: ${formatCurrency(job.BidPrice)}`,
              right: `spent: ${formatCurrency(0)}`,
            },
          ],
        };
      });

      setJobListEntries(listData);
    }
  }, [allJobs]);

  const onLikePressed = useCallback(
    async (jobId: string) => {
      const matchingJob = allJobs.find((j) => j._id! === jobId);
      if (matchingJob) {
        const updatedJob = {
          ...matchingJob,
          Favorite: matchingJob.Favorite === undefined ? 1 : matchingJob.Favorite > 0 ? 0 : 1,
        };
        const status = await jobDbHost?.GetJobDB().UpdateJob(updatedJob);
        if (status === 'Success') {
          updateJob(updatedJob._id!, updatedJob); // update the jobDataStore
          await logInfo(`Job successfully updated: ${updatedJob.Name}`);
        } else {
          await logInfo(`Job update failed: %{updatedJob.Name}`);
        }
      }
    },
    [allJobs, jobDbHost, loadJobs, logInfo],
  );

  const jobActionButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="heart-o" size={24} color={colors.iconColor} />,
        favoriteIcon: <FontAwesome name="heart" size={24} color={colors.iconColor} />,
        label: 'Like',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId) onLikePressed(actionContext.entryId);
          }
        },
      },
      {
        icon: <FontAwesome name="sticky-note-o" size={24} color={colors.iconColor} />,
        label: 'Notes',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId)
              router.push(`/jobs/${actionContext.entryId}/notes/?jobName=${actionContext.primaryTitle}`);
          }
        },
      },
      {
        icon: <FontAwesome name="photo" size={24} color={colors.iconColor} />,
        label: 'Photos',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId)
              router.push(`/jobs/${actionContext.entryId}/photos/?jobName=${actionContext.primaryTitle}`);
          }
        },
      },
      {
        icon: <Ionicons name="receipt-outline" size={24} color={colors.iconColor} />,
        label: 'Receipts',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId)
              router.push(`/jobs/${actionContext.entryId}/receipts/?jobName=${actionContext.primaryTitle}`);
          }
        },
      },

      {
        icon: <Entypo name="text-document" size={24} color={colors.iconColor} />,
        label: 'Invoices',
        onPress: (e, actionContext) => {
          if (actionContext && actionContext.entryId)
            router.push(`/jobs/${actionContext.entryId}/invoices/?jobName=${actionContext.primaryTitle}`);
        },
      },
    ],
    [colors, onLikePressed],
  );

  useEffect(() => {
    loadJobs();
  }, [jobDbHost]);

  const handleSelection = useCallback(
    (entry: TwoColumnListEntry) => {
      const job = allJobs.find((j) => (j._id ?? '') === entry.entryId);
      if (job && job._id) router.push(`/jobs/${job._id}`);
      console.log(`Hello from item ${entry.primaryTitle}`);
    },
    [allJobs],
  );

  const handleJobDbShare = useCallback(async () => {
    console.log(`Sharing job db file... ${jobDbHost}`);
    await jobDbHost?.Share();
    console.log('Job db file shared');
  }, [jobDbHost]);

  const handleMenuItemPress = useCallback(
    async (item: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (item === 'AddJob') {
        router.push(`/jobs/add-job`);
      } else if (item === 'ShareLog') {
        console.log('Sharing log file...');
        shareLogFile();
        console.log('Log file shared');
      } else if (item === 'ShareJobDb') {
        handleJobDbShare();
      } else if (item === 'Configuration') {
        router.push('/jobs/configuration/home');
      }
    },
    [shareLogFile, logInfo],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Add Job',
        onPress: (e, actionContext) => {
          handleMenuItemPress('AddJob', actionContext);
        },
      },
      {
        icon: <FontAwesome name="gear" size={28} color={colors.iconColor} />,
        label: 'Configuration',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Configuration', actionContext);
        },
      },
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Share Log',
        onPress: (e, actionContext) => {
          handleMenuItemPress('ShareLog', actionContext);
        },
      },
    ],
    [colors],
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Jobs',
          headerRight: () => (
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
          ),
        }}
      />

      <View style={{ flex: 1, width: '100%' }}>
        {jobListEntries.length > 0 ? (
          <View style={[styles.twoColListContainer, { backgroundColor: colors.screenBackground }]}>
            <TwoColumnList data={jobListEntries} onPress={handleSelection} buttons={jobActionButtons} />
          </View>
        ) : (
          <View style={[styles.container, { padding: 20, backgroundColor: colors.screenBackground }]}>
            <Text text="No Jobs Found!" txtSize="xl" />
            <Text text="Use menu in upper right to add one." />
          </View>
        )}
      </View>
      {headerMenuModalVisible && (
        <RightHeaderMenu
          modalVisible={headerMenuModalVisible}
          setModalVisible={setHeaderMenuModalVisible}
          buttons={rightHeaderMenuButtons}
        />
      )}
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  twoColListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
