import { ActionButtonProps } from '@/components/ButtonBar';
import { Text, View } from '@/components/Themed';
import { TwoColumnList, TwoColumnListEntry } from '@/components/TwoColumnList';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import RightHeaderMenu from '@/components/RightHeaderMenu';
import { useDbLogger } from '@/context/LoggerContext';

import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getProjectValue,
  setProjectValue,
  useAllProjects,
  useProjectValue,
  useToggleFavoriteCallback,
} from '@/tbStores/ListOfProjectsStore';

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
  const allProjects = useAllProjects();
  const toggleFavorite = useToggleFavoriteCallback();
  const [jobListEntries, setJobListEntries] = useState<TwoColumnListEntry[]>([]);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const navigation = useNavigation();
  const { logInfo, shareLogFile } = useDbLogger();
  const colorScheme = useColorScheme();
  const router = useRouter();

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

  useEffect(() => {
    if (allProjects) {
      const listData: TwoColumnListEntry[] = allProjects.map((project) => {
        return {
          primaryTitle: project.name ? project.name : 'unknown',
          isFavorite: undefined !== project.favorite ? project.favorite > 0 : false,
          entryId: project._id ?? '1',
          imageUri: project.thumbnail ?? 'x',
          secondaryTitle: project.location,
          tertiaryTitle: project.ownerName ?? 'Owner',
          lines: [
            {
              left: `start: ${formatDate(new Date(project.startDate ?? 0))}`,
              right: `bid: ${formatCurrency(project.bidPrice)}`,
            },
            {
              left: `due: ${formatDate(new Date(project.plannedFinish ?? 0))}`,
              right: `spent: ${formatCurrency(0)}`,
            },
          ],
        };
      });

      setJobListEntries(listData);
    }
  }, [allProjects]);

  const onLikePressed = (projId: string) => {
    toggleFavorite(projId);
  };

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

  const handleSelection = useCallback(
    (entry: TwoColumnListEntry) => {
      const job = allProjects.find((j) => (j._id ?? '') === entry.entryId);
      if (job && job._id) router.push(`/jobs/${job._id}`);
      console.log(`Hello from item ${entry.primaryTitle}`);
    },
    [allProjects],
  );

  const handleMenuItemPress = useCallback(
    async (item: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (item === 'AddProject') {
        router.push(`/jobs/add-project`);
      } else if (item === 'ShareLog') {
        console.log('Sharing log file...');
        shareLogFile();
        console.log('Log file shared');
      } else if (item === 'Configuration') {
        router.push('/jobs/configuration/home');
      } else if (item === 'Invite') {
        router.push('/(auth)/invite');
      }
    },
    [shareLogFile, logInfo],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Add Project',
        onPress: (e, actionContext) => {
          handleMenuItemPress('AddProject', actionContext);
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
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Invite Team Members',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Invite', actionContext);
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
          title: 'Projects',
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
            <Text text="No Projects Found!" txtSize="xl" />
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
