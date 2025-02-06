import { StyleSheet } from 'react-native';
import { ActionButtonProps } from '@/components/ButtonBar';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { JobSummary } from '@/models/jobSummary';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJobList } from '@/api/job';
import { Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';

function isEntry(obj: any): obj is TwoColumnListEntry {
  return typeof obj.primaryTitle === 'string' && typeof obj.secondaryTitle === 'string';
}

export default function JobHomeScreen() {
  const colorScheme = useColorScheme();
  const [allJobs, setAllJobs] = useState<JobSummary[]>([]);
  const [jobListEntries, setJobListEntries] = useState<TwoColumnListEntry[]>([]);

  const navigation = useNavigation();

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
  }, []);

  const buttons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name='heart-o' size={16} color={colors.iconColor} />,
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
        icon: <FontAwesome name='comment-o' size={16} color={colors.iconColor} />,
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
        icon: <FontAwesome name='share' size={16} color={colors.iconColor} />,
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
    [colors]
  );

  React.useEffect(() => {
    const state = navigation.getState();
    console.log('Current stack state:', state);
  }, [navigation]);

  useEffect(() => {
    async function loadJobs() {
      const jobs = await fetchJobList();

      if (jobs) {
        const listData: TwoColumnListEntry[] = jobs.map((job) => {
          return {
            primaryTitle: job.name,
            entryId: job.jobId,
            imageUri: '',
            secondaryTitle: formatDate(job.plannedFinish),
            lines: [
              {
                left: `bid: ${formatCurrency(job.bidPrice)}`,
                right: `spent: ${formatCurrency(job.spentToDate)}`,
              },
            ],
          };
        });

        setAllJobs(jobs);
        setJobListEntries(listData);
      }
    }
    loadJobs();
  }, []);

  const router = useRouter();
  React.useEffect(() => {
    console.log('Router output', router);
  }, [router]);

  const handleSelection = useCallback(
    (entry: TwoColumnListEntry) => {
      const job = allJobs.find((j) => j.jobId == entry.entryId);
      if (job) router.push(`/(tabs)/jobs/${job.jobId}?jobName=${job.name}`);
      console.log(`Hello from item ${entry.primaryTitle}`);
    },
    [allJobs]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.twoColListContainer, { backgroundColor: colors.screenBackground }]}>
          <TwoColumnList data={jobListEntries} onPress={handleSelection} buttons={buttons} />
        </View>
      </View>
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
});
