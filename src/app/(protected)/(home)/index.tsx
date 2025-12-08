import { ActionButtonProps } from '@/src/components/ButtonBar';
import { ProjectList, ProjectListEntryProps } from '@/src/components/ProjectList';
import { Text, View } from '@/src/components/Themed';
import { formatDate } from '@/src/utils/formatters';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, Linking, Platform, StyleSheet } from 'react-native';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllProjects, useToggleFavoriteCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows,
  WorkCategoryCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { AntDesign } from '@expo/vector-icons';
import { ActionButton } from '@/src/components/ActionButton';

function MaterialDesignTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function isEntry(obj: any): obj is ProjectListEntryProps {
  return typeof obj.projectName === 'string' && typeof obj.projectId === 'string';
}

export default function ProjectHomeScreen() {
  const allProjects = useAllProjects();
  const { addActiveProjectIds } = useActiveProjectIds();
  const toggleFavorite = useToggleFavoriteCallback();
  const [projectListEntries, setProjectListEntries] = useState<ProjectListEntryProps[]>([]);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();
  const colors = useColors();
  const auth = useAuth();
  const { orgRole, orgId } = auth;
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allProjectTemplates = useAllRows('templates');

  useEffect(() => {
    if (allProjects.length === 0) return;
    // create an array of projectId that have been favorited
    const favoriteProjectIds = allProjects
      .filter((project) => project.id && project.favorite && project.favorite > 0)
      .map((project) => project.id);
    addActiveProjectIds(favoriteProjectIds);
  }, [allProjects, addActiveProjectIds]);

  useEffect(() => {
    if (allProjects.length > 0) {
      const listData: ProjectListEntryProps[] = allProjects.map((project) => {
        return {
          projectName: project.name ? project.name : 'unknown',
          isFavorite: undefined !== project.favorite ? project.favorite > 0 : false,
          projectId: project.id ?? 'unknown',
          imageUri: project.thumbnail ?? 'x',
          location: project.location,
          ownerName: project.ownerName ?? 'Owner',
          startDate: `${formatDate(new Date(project.startDate ?? 0))}`,
          finishDate: `${formatDate(new Date(project.plannedFinish ?? 0))}`,
          bidPrice: project.bidPrice,
          amountSpent: project.amountSpent,
          ownerAddress: project.ownerAddress,
          ownerAddress2: project.ownerAddress2 ?? '',
          ownerCity: project.ownerCity ?? '',
          ownerState: project.ownerState ?? '',
          ownerZip: project.ownerZip ?? '',
          ownerPhone: project.ownerPhone ?? '',
          ownerEmail: project.ownerEmail ?? '',
        };
      });

      setProjectListEntries(listData);
    } else {
      setProjectListEntries([]);
    }
  }, [allProjects]);

  const onLikePressed = (projId: string) => {
    toggleFavorite(projId);
  };

  const minConfigMet: boolean = useMemo(
    () =>
      allCategories &&
      allCategories.length > 0 /* && allProjectTemplates && allProjectTemplates.length > 0 */,
    [allCategories, allProjectTemplates],
  );

  useEffect(() => {
    if (minConfigMet) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [minConfigMet]);

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
                  projectName: actionContext.projectName,
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
                  projectName: actionContext.projectName,
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
                  projectName: actionContext.projectName,
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
                projectName: actionContext.projectName,
              },
            });
        },
      },
      {
        icon: <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.iconColor} />,
        label: 'Changes',
        onPress: (e, actionContext) => {
          if (actionContext && actionContext.projectId)
            router.push({
              pathname: '/[projectId]/changes',
              params: {
                projectId: actionContext.projectId,
                projectName: actionContext.projectName,
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
      } else Alert.alert(`Project not found: ${entry.projectName} (${entry.projectId})`);
    },
    [allProjects, router],
  );

  const handleMenuItemPress = useCallback(
    async (item: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (item === 'AddProject') {
        router.push('/add-project');
      } else if (item === 'Configuration') {
        router.push('/configuration/home');
      } else if (item === 'AppSettings') {
        router.push('/appSettings/SetAppSettings');
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
  }, [signOut, router]);

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(() => {
    const showInvite = orgId && orgRole.includes('admin');
    const showAddProject = allCategories.length > 0;

    const menuButtons: ActionButtonProps[] = [
      ...(showAddProject
        ? [
            {
              icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
              label: 'Add Project',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('AddProject', actionContext);
              },
            },
          ]
        : []),
      {
        icon: <AntDesign name="contacts" size={28} color={colors.iconColor} />,
        label: 'Company Settings',
        onPress: (e, actionContext) => {
          handleMenuItemPress('AppSettings', actionContext);
        },
      },
      {
        icon: <FontAwesome name="gear" size={28} color={colors.iconColor} />,
        label: 'Configuration',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Configuration', actionContext);
        },
      },
      ...(showInvite
        ? [
            {
              icon: <AntDesign name="user-add" size={28} color={colors.iconColor} />,
              label: 'Manage Team',
              onPress: (e, actionContext) => {
                handleMenuItemPress('Invite', actionContext);
              },
            } as ActionButtonProps,
          ]
        : []),
      {
        icon: <Entypo name="log-out" size={28} color={colors.iconColor} />,
        label: 'Logout',
        onPress: async (e, actionContext) => {
          handleSignOut();
        },
      },
    ];
    return menuButtons;
  }, [colors, handleMenuItemPress, allCategories, orgId, orgRole, handleSignOut]);

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

  // wait to give tiny base to get and sync any data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container, { marginTop: 20 }]}>
        <ActivityIndicator size="large" color={colors.iconColor} />
        <Text txtSize="title" style={{ marginTop: 16 }}>
          Initializing...
        </Text>
      </SafeAreaView>
    );
  }

  // wait a little longer if we still haven't loaded up cost codes and project templates
  if (isLoading) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container, { marginTop: 20 }]}>
        <ActivityIndicator size="large" color={colors.iconColor} />
        <Text txtSize="title" style={{ marginTop: 16 }}>
          Loading configuration...
        </Text>
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
          <View style={[styles.container, { padding: 10, backgroundColor: colors.background }]}>
            {minConfigMet ? (
              <>
                <Text text="No Projects Found!" txtSize="xl" style={{ marginBottom: 10 }} />
                <Text text="Use menu in upper right to add one." />
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <Text text="Welcome to" txtSize="title" />
                  <Text text="ProjectHound!" txtSize="xl" />
                </View>
                <Text
                  text="Before we can start helping you manage project costs we must know what cost items you want to track. 
                You can import your own work items, choose one we provide, or manually create your own within this application.
                If you want to get more information on how to set up your cost codes please visit our support site."
                />

                <ActionButton
                  style={{ zIndex: 1, marginTop: 10, width: '95%', maxWidth: 400 }}
                  onPress={() => Linking.openURL('https://projecthoundinfo.pages.dev/setup')}
                  type="action"
                  title="Open Support Site"
                />
                <ActionButton
                  style={{ zIndex: 1, marginTop: 10, width: '95%', maxWidth: 400 }}
                  onPress={() => router.push(`/configuration/workcategory/importFromCsv/`)}
                  type="action"
                  title="Import from a CSV file..."
                />
                <ActionButton
                  style={{ zIndex: 1, marginTop: 10, width: '95%', maxWidth: 400 }}
                  onPress={() => router.push(`/configuration/workcategory/seedCategoriesSelection/`)}
                  type="action"
                  title="Choose one of our defaults..."
                />

                <ActionButton
                  title="Go To Configuration"
                  type="action"
                  onPress={() => router.push('/configuration/home')}
                  style={{ marginTop: 10, marginBottom: 10, width: '95%', maxWidth: 400 }}
                />
              </>
            )}
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
    width: '100%',
  },
  twoColListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
