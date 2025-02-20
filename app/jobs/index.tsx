import { ActionButtonProps } from '@/components/ButtonBar';
import { Text, View } from '@/components/Themed';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import EditJobModalScreen from '@/app/(modals)/EditJobModalScreen';
import JobModalScreen from '@/app/(modals)/JobModalScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';

function MaterialDesignTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function HomeScreenModalMenu({
  modalVisible,
  setModalVisible,
  onMenuItemPress,
}: {
  modalVisible: boolean;
  setModalVisible: (val: boolean) => void;
  onMenuItemPress: (item: string) => void;
}) {
  const handleMenuItemPress = (item: string): void => {
    console.log(`${item} pressed`);
    setModalVisible(false); // Close the modal after selecting an item
    onMenuItemPress(item);
  };

  const colorScheme = useColorScheme();
  const colors =
    colorScheme === 'dark'
      ? {
          screenBackground: Colors.dark.background,
          separatorColor: Colors.dark.separatorColor,
          modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
        }
      : {
          screenBackground: Colors.light.background,
          separatorColor: Colors.light.separatorColor,
          modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
        };

  const topMargin = Platform.OS === 'ios' ? 110 : 50;

  return (
    <SafeAreaView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close on back press
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.screenBackground, marginTop: topMargin },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleMenuItemPress('AddJob')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Add Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMenuItemPress('Option 1')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Option 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMenuItemPress('Option 2')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Option 2</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function isEntry(obj: any): obj is TwoColumnListEntry {
  return typeof obj.primaryTitle === 'string' && typeof obj.secondaryTitle === 'string';
}

export default function JobHomeScreen() {
  const colorScheme = useColorScheme();
  const [allJobs, setAllJobs] = useState<JobData[]>([]);
  const [jobListEntries, setJobListEntries] = useState<TwoColumnListEntry[]>([]);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [editJobId, setEditJobId] = useState<string | undefined>();
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);

  const navigation = useNavigation();
  const { jobDbHost } = useJobDb();

  const loadJobs = useCallback(async () => {
    const today = new Date();
    const futureDay = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
    const result = await jobDbHost?.GetJobDB().FetchAllJobs();
    const jobs = result ? result.jobs : [];
    // sort based on favorite and then be planned finish date
    jobs
      .sort((a, b) => (b.Favorite ?? 0) - (a.Favorite ?? 0))
      .sort((a, b) =>
        a.Favorite === b.Favorite
          ? (a.PlannedFinish ? a.PlannedFinish.getTime() : futureDay.getTime()) -
            (b.PlannedFinish ? b.PlannedFinish.getTime() : futureDay.getTime())
          : 0,
      );

    if (jobs) {
      const listData: TwoColumnListEntry[] = jobs.map((job) => {
        return {
          primaryTitle: job.Name ? job.Name : 'unknown',
          isFavorite: undefined !== job.Favorite ? job.Favorite > 0 : false,
          entryId: job._id ?? '1',
          imageUri: 'x',
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

      setAllJobs(jobs);
      setJobListEntries(listData);
    }
  }, [jobDbHost]);

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
          console.log('Job successfully updated:', updatedJob.Name);
          loadJobs();
        } else {
          console.log('Job update failed:', updatedJob.Name);
        }
      }
    },
    [allJobs, jobDbHost, loadJobs],
  );

  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(() => {
    const clrs =
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
          };

    return clrs;
  }, [colorScheme]);

  const buttons: ActionButtonProps[] = useMemo(
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
              router.push(`/jobs/notes/${actionContext.entryId}?jobName=${actionContext.primaryTitle}`);
          }
        },
      },
      {
        icon: <FontAwesome name="photo" size={24} color={colors.iconColor} />,
        label: 'Photos',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId)
              router.push(`/jobs/photos/${actionContext.entryId}?jobName=${actionContext.primaryTitle}`);
          }
        },
      },
      {
        icon: <Ionicons name="receipt-outline" size={24} color={colors.iconColor} />,
        label: 'Receipts',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.entryId)
              router.push(`/jobs/receipts/${actionContext.entryId}?jobName=${actionContext.primaryTitle}`);
          }
        },
      },

      {
        icon: <MaterialCommunityIcons name="menu" size={24} color={colors.iconColor} />,
        label: 'Edit',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            setEditJobId(actionContext.entryId);
          } else {
            console.log('Share pressed - ', actionContext);
          }
        },
      },
    ],
    [colors, onLikePressed],
  );

  React.useEffect(() => {
    const state = navigation.getState();
    console.log('Current stack state:', state);
  }, [navigation]);

  useEffect(() => {
    loadJobs();
  }, [jobDbHost]);

  const router = useRouter();
  React.useEffect(() => {
    console.log('Router output', router);
  }, [router]);

  const handleSelection = useCallback(
    (entry: TwoColumnListEntry) => {
      const job = allJobs.find((j) => (j._id ?? '') === entry.entryId);
      if (job && job._id) router.push(`/jobs/${job._id}?jobName=${job.Name}`);
      console.log(`Hello from item ${entry.primaryTitle}`);
    },
    [allJobs],
  );

  const showJobModal = useCallback(() => setJobModalVisible(true), []);
  const hideJobModal = useCallback(
    (success: boolean) => {
      setJobModalVisible(false);
      if (success) loadJobs();
    },
    [loadJobs],
  );

  const hideEditJobModal = useCallback(
    (success: boolean) => {
      setEditJobId(undefined);
      if (success) loadJobs();
    },
    [loadJobs],
  );

  const handleMenuItemPress = useCallback((item: string) => {
    if (item === 'AddJob') showJobModal();
  }, []);

  return (
    <>
      {Platform.OS === 'android' ? (
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <ScreenHeader
                title="Jobs"
                headerRight={() => (
                  <Pressable
                    onPress={() => {
                      setMenuModalVisible(!menuModalVisible);
                    }}
                  >
                    {({ pressed }) => (
                      <Ionicons
                        name="settings-sharp"
                        size={24}
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
            title: 'Jobs',
            headerRight: () => (
              <Pressable
                onPress={() => {
                  setMenuModalVisible(!menuModalVisible);
                }}
              >
                {({ pressed }) => (
                  <Ionicons
                    name="settings-sharp"
                    size={24}
                    color={colors.iconColor}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
      )}

      <View style={styles.container}>
        <View style={[styles.twoColListContainer, { backgroundColor: colors.screenBackground }]}>
          <TwoColumnList data={jobListEntries} onPress={handleSelection} buttons={buttons} />
        </View>
      </View>
      <HomeScreenModalMenu
        modalVisible={menuModalVisible}
        setModalVisible={setMenuModalVisible}
        onMenuItemPress={handleMenuItemPress}
      />
      {/* Pass visibility state and hide function to JobModalScreen */}
      <JobModalScreen visible={jobModalVisible} hideModal={hideJobModal} />
      <EditJobModalScreen jobId={editJobId} hideModal={hideEditJobModal} />
    </>
  );
}

const styles = StyleSheet.create({
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
    padding: 10,
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
});
