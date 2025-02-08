import { StyleSheet } from 'react-native';
import { ActionButtonProps } from '@/components/ButtonBar';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useJobDb } from '@/session/DatabaseContext';
import { JobData } from 'jobdb';

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
