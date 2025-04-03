import BottomSheetContainer from '@/components/BottomSheetContainer';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const JobDetailsPage = () => {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colorScheme = useColorScheme();
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
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
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            borderColor: Colors.light.borderColor,
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
      if (menuItem === 'Edit' && jobId) router.push(`/jobs/${jobId}/edit/?jobName=${job.name}`);
      //if (menuItem === 'Edit' && jobId) router.push(`/jobs/[jobId]/edit/${jobId}?jobName=${job.name}`);
    },
    [jobId, job],
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

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <View style={styles.container}>
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

        <View style={styles.headerContainer}>
          <Text txtSize="title" text={job.name} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text text={`start: ${formatDate(job.startDate)}`} />
            <Text text={`bid: ${formatCurrency(job.bidPrice ?? 0)}`} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text text={`due: ${formatDate(job.finishDate)}`} />
            <Text text={`spent: ${formatCurrency(totalSpent)}`} />
          </View>
        </View>
        <View style={{ flex: 1 }}></View>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    marginTop: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
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

export default JobDetailsPage;
