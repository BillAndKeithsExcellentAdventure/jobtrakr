import { Modal, Platform, Pressable, SafeAreaView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ActionButtonProps } from '@/components/ButtonBar';
import { View, Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialDesign from '@expo/vector-icons/MaterialCommunityIcons';

import { useJobDb } from '@/session/DatabaseContext';
import { JobData } from 'jobdb';
import { ScreenHeader } from '@/components/ScreenHeader';

function MaterialDesignTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialDesign>['name'];
  color: string;
}) {
  return <MaterialDesign size={28} style={{ marginBottom: -3 }} {...props} />;
}

function HomeScreenModalMenu({
  modalVisible,
  setModalVisible,
}: {
  modalVisible: boolean;
  setModalVisible: (val: boolean) => void;
}) {
  const handleMenuItemPress = (item: string): void => {
    console.log(`${item} pressed`);
    setModalVisible(false); // Close the modal after selecting an item
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

  const navigation = useNavigation();
  const { jobDbHost } = useJobDb();

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
        icon: <FontAwesome name="heart-o" size={16} color={colors.iconColor} />,
        label: 'Like',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            console.log('Like pressed - ', actionContext.primaryTitle);
          } else {
            console.log('Like pressed - ', actionContext);
          }
        },
      },
      {
        icon: <FontAwesome name="comment-o" size={16} color={colors.iconColor} />,
        label: 'Comment',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            console.log('Comment pressed - ', actionContext.primaryTitle);
          } else {
            console.log('Comment pressed - ', actionContext);
          }
        },
      },
      {
        icon: <FontAwesome name="share" size={16} color={colors.iconColor} />,
        label: 'Share',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            console.log('Share pressed - ', actionContext.primaryTitle);
          } else {
            console.log('Share pressed - ', actionContext);
          }
        },
      },
    ],
    [colors],
  );

  React.useEffect(() => {
    const state = navigation.getState();
    console.log('Current stack state:', state);
  }, [navigation]);

  useEffect(() => {
    async function loadJobs() {
      const result = await jobDbHost?.GetJobDB().FetchAllJobs();
      const jobs = result ? result.jobs : [];

      if (jobs) {
        const listData: TwoColumnListEntry[] = jobs.map((job) => {
          return {
            primaryTitle: job.Name ? job.Name : 'unknown',
            entryId: job._id ? job._id.toString() : '1',
            imageUri: '',
            secondaryTitle: formatDate(job.PlannedFinish),
            lines: [
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
    }
    loadJobs();
  }, [jobDbHost]);

  const router = useRouter();
  React.useEffect(() => {
    console.log('Router output', router);
  }, [router]);

  const handleSelection = useCallback(
    (entry: TwoColumnListEntry) => {
      const job = allJobs.find((j) => (j._id ? j._id.toString() : '') === entry.entryId);
      if (job && job._id) router.push(`/(tabs)/jobs/${job._id}?jobName=${job.Name}`);
      console.log(`Hello from item ${entry.primaryTitle}`);
    },
    [allJobs],
  );

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  return (
    <>
      {Platform.OS === 'android' ? (
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <ScreenHeader
                title="Android Home Screen"
                headerRight={() => (
                  <Pressable
                    onPress={() => {
                      setModalVisible(!modalVisible);
                    }}
                  >
                    {({ pressed }) => (
                      <MaterialDesignTabBarIcon
                        name="cog"
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
            title: 'Std Home Screen',
            headerRight: () => (
              <Pressable
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                {({ pressed }) => (
                  <MaterialDesignTabBarIcon
                    name="cog"
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
      <HomeScreenModalMenu modalVisible={modalVisible} setModalVisible={setModalVisible} />
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
