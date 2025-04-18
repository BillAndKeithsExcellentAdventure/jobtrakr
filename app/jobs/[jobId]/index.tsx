import BottomSheetContainer from '@/components/BottomSheetContainer';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useProject, useDeleteProjectCallback } from '@/tbStores/ListOfProjectsStore';
import { useAllWorkItemSummaries } from '@/tbStores/projectDetails/workItemsSummary';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, Stack, useLocalSearchParams, Redirect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const JobDetailsPage = () => {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const projectData = useProject(jobId);
  const processDeleteProject = useDeleteProjectCallback();
  const { removeActiveProjectId } = useActiveProjectIds();
  const allWorkItemSummaries = useAllWorkItemSummaries(jobId);
  const colorScheme = useColorScheme();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);

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

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && jobId) {
        router.push(`/jobs/${jobId}/edit/?jobName=${projectData!.name}`);
        return;
      } else if (menuItem === 'Delete' && jobId) {
        Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => {
              const result = processDeleteProject(jobId);
              if (result.status === 'Success') {
                removeActiveProjectId(jobId);
              }
              router.replace('/jobs');
            },
          },
        ]);

        return;
      }
    },
    [jobId, projectData, router, processDeleteProject],
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

  if (!projectData) {
    // Redirect to the jobs list if no project data is found
    return <Redirect href="/jobs" />;
  }

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
          <Text txtSize="title" text={projectData.name} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text text={`start: ${formatDate(projectData.startDate)}`} />
            <Text text={`bid: ${formatCurrency(projectData.bidPrice)}`} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text text={`due: ${formatDate(projectData.plannedFinish)}`} />
            <Text text={`spent: ${formatCurrency(projectData.amountSpent)}`} />
          </View>
        </View>
        <View style={{ flex: 1, padding: 10 }}>
          <View style={{ marginBottom: 10, alignItems: 'center' }}>
            <Text txtSize="title" text="Cost Items" />
          </View>
          <FlatList
            data={allWorkItemSummaries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <Text text={item.workItemId} />
                <Text text={`Bid ${formatCurrency(item.bidAmount)}`} />
                <Text text={`Spent ${formatCurrency(item.spentAmount)}`} />
              </View>
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No cost items found." />
              </View>
            )}
          />
        </View>
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
