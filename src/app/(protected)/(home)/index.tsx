import { ActionButtonProps } from '@/src/components/ButtonBar';
import { Text, View } from '@/src/components/Themed';
import { ProjectList, ProjectListEntryProps } from '@/src/components/ProjectList';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';

import RightHeaderMenu from '@/src/components/RightHeaderMenu';

import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAllProjects, useToggleFavoriteCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';

import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { useClerk } from '@clerk/clerk-expo';
import { AntDesign } from '@expo/vector-icons';
import AuthorizedStoresProvider from '@/src/components/AuthorizedStoresProvider';

function MaterialDesignTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function isEntry(obj: any): obj is ProjectListEntryProps {
  return typeof obj.primaryTitle === 'string' && typeof obj.secondaryTitle === 'string';
}

export default function ProjectHomeScreen() {
  const allProjects = useAllProjects();
  const { addActiveProjectIds } = useActiveProjectIds();
  const toggleFavorite = useToggleFavoriteCallback();
  const [projectListEntries, setProjectListEntries] = useState<ProjectListEntryProps[]>([]);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();
  const colors = useColors();

  useEffect(() => {
    // create an array of projectId that have been favorited
    const favoriteProjectIds = allProjects
      .filter((project) => project.id && project.favorite && project.favorite > 0)
      .map((project) => project.id);
    addActiveProjectIds(favoriteProjectIds);
  }, [allProjects, addActiveProjectIds]);

  useEffect(() => {
    if (allProjects) {
      const listData: ProjectListEntryProps[] = allProjects.map((project) => {
        return {
          primaryTitle: project.name ? project.name : 'unknown',
          isFavorite: undefined !== project.favorite ? project.favorite > 0 : false,
          projectId: project.id ?? 'unknown',
          imageUri: project.thumbnail ?? 'x',
          secondaryTitle: project.location,
          tertiaryTitle: project.ownerName ?? 'Owner',
          lines: [
            {
              left: `start: ${formatDate(new Date(project.startDate ?? 0))}`,
              right: `estimate: ${formatCurrency(project.bidPrice, true)}`,
            },
            {
              left: `due: ${formatDate(new Date(project.plannedFinish ?? 0))}`,
              right: `spent: ${formatCurrency(project.amountSpent, true)}`,
            },
          ],
        };
      });

      setProjectListEntries(listData);
    }
  }, [allProjects]);

  const onLikePressed = (projId: string) => {
    toggleFavorite(projId);
  };

  const projectActionButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="heart-o" size={24} color={colors.iconColor} />,
        favoriteIcon: <FontAwesome name="heart" size={24} color={colors.iconColor} />,
        label: 'Like',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.projectId) onLikePressed(actionContext.projectId);
          }
        },
      },
      {
        icon: <FontAwesome name="sticky-note-o" size={24} color={colors.iconColor} />,
        label: 'Notes',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.projectId)
              router.push({
                pathname: '/[projectId]/notes',
                params: {
                  projectId: actionContext.projectId,
                  projectName: actionContext.primaryTitle,
                },
              });
          }
        },
      },
      {
        icon: <FontAwesome name="photo" size={24} color={colors.iconColor} />,
        label: 'Photos',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.projectId)
              router.push({
                pathname: '/[projectId]/photos',
                params: {
                  projectId: actionContext.projectId,
                  projectName: actionContext.primaryTitle,
                },
              });
          }
        },
      },
      {
        icon: <Ionicons name="receipt-outline" size={24} color={colors.iconColor} />,
        label: 'Receipts',
        onPress: (e, actionContext) => {
          if (isEntry(actionContext)) {
            if (actionContext && actionContext.projectId)
              router.push({
                pathname: '/[projectId]/receipts',
                params: {
                  projectId: actionContext.projectId,
                  projectName: actionContext.primaryTitle,
                },
              });
          }
        },
      },

      {
        icon: <Entypo name="text-document" size={24} color={colors.iconColor} />,
        label: 'Invoices',
        onPress: (e, actionContext) => {
          if (actionContext && actionContext.projectId)
            router.push({
              pathname: '/[projectId]/invoices',
              params: {
                projectId: actionContext.projectId,
                projectName: actionContext.primaryTitle,
              },
            });
        },
      },
    ],
    [colors, onLikePressed, router],
  );

  const handleSelection = useCallback(
    (entry: ProjectListEntryProps) => {
      const project = allProjects.find((j) => (j.id ?? '') === entry.projectId);
      if (project && project.id) {
        router.push({ pathname: '/[projectId]', params: { projectId: project.id } });
      } else Alert.alert(`Project not found: ${entry.primaryTitle} (${entry.projectId})`);
    },
    [allProjects],
  );

  const handleMenuItemPress = useCallback(
    async (item: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (item === 'AddProject') {
        router.push('/add-project');
      } else if (item === 'Configuration') {
        router.push('/configuration/home');
      } else if (item === 'Invite') {
        router.push({ pathname: '/(protected)/(home)/InviteUser' });
      } else if (item === 'Logout') {
        signOut();
        router.replace('/sign-in');
      }
    },
    [router, signOut],
  );

  const handleSignOut = useCallback(async () => {
    await signOut(() => {
      router.replace('/sign-in');
    });
  }, [signOut]);

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
        icon: <AntDesign name="adduser" size={28} color={colors.iconColor} />,
        label: 'Invite Team Members',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Invite', actionContext);
        },
      },
      {
        icon: <Entypo name="log-out" size={28} color={colors.iconColor} />,
        label: 'Logout',
        onPress: async (e, actionContext) => {
          handleSignOut();
        },
      },
    ],
    [colors, handleMenuItemPress],
  );

  const headerRightComponent = useMemo(() => {
    return {
      headerRight: () => (
        <View
          style={{
            minWidth: 30,
            minHeight: 30,
            flexDirection: 'row',
            backgroundColor: 'transparent',
            marginRight: Platform.OS === 'android' ? 16 : 0,
          }}
        >
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              setHeaderMenuModalVisible(!headerMenuModalVisible);
            }}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.iconColor} />
          </Pressable>
        </View>
      ),
    };
  }, [colors.iconColor, headerMenuModalVisible, setHeaderMenuModalVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
        <Text txtSize="title">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Projects',
          ...headerRightComponent,
        }}
      />

      <View style={{ flex: 1, width: '100%' }}>
        {projectListEntries.length > 0 ? (
          <View style={[styles.twoColListContainer, { backgroundColor: colors.background }]}>
            <ProjectList data={projectListEntries} onPress={handleSelection} buttons={projectActionButtons} />
          </View>
        ) : (
          <View style={[styles.container, { padding: 20, backgroundColor: colors.background }]}>
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
