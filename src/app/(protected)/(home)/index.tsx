import { ActionButtonProps } from '@/src/components/ButtonBar';
import { ProjectList, ProjectListEntryProps } from '@/src/components/ProjectList';
import { Text, View } from '@/src/components/Themed';
import { formatDate } from '@/src/utils/formatters';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, Platform, StyleSheet } from 'react-native';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllProjects, useToggleFavoriteCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  useAllRows,
  WorkCategoryCodeCompareAsNumber,
  useAddRowCallback,
  useUpdateRowCallback,
  AccountData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { AntDesign } from '@expo/vector-icons';
import { ActionButton } from '@/src/components/ActionButton';
import { DOCS_URL } from '@/src/constants/app-constants';
import { Image } from 'expo-image';
import { useColorScheme } from '@/src/components/useColorScheme';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { SvgImage } from '@/src/components/SvgImage';
import { fetchAccounts } from '@/src/utils/quickbooksAPI';

function isEntry(obj: any): obj is ProjectListEntryProps {
  return typeof obj.projectName === 'string' && typeof obj.projectId === 'string';
}

export default function ProjectHomeScreen() {
  const allProjects = useAllProjects();
  const { addActiveProjectIds } = useActiveProjectIds();
  const toggleFavorite = useToggleFavoriteCallback();
  const [projectListEntries, setProjectListEntries] = useState<ProjectListEntryProps[]>([]);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const auth = useAuth();
  const { orgRole, orgId } = auth;
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const { isConnectedToQuickBooks } = useNetwork();
  const allAccounts = useAllRows('accounts');
  const addAccount = useAddRowCallback('accounts');
  const updateAccount = useUpdateRowCallback('accounts');

  const appSettings = useAppSettings();

  const minAppSettingsMet: boolean = useMemo(() => {
    return (
      appSettings.companyName.trim().length > 0 &&
      appSettings.ownerName.trim().length > 0 &&
      appSettings.address.trim().length > 0 &&
      appSettings.city.trim().length > 0 &&
      appSettings.state.trim().length > 0 &&
      appSettings.zip.trim().length > 0 &&
      appSettings.email.trim().length > 0 &&
      appSettings.phone.trim().length > 0
    );
  }, [appSettings]);

  const allVisibleCategories = useMemo(() => allCategories.filter((c) => !c.hidden), [allCategories]);

  const splashImage = useMemo(
    () =>
      colorScheme === 'dark'
        ? require('@/assets/images/splash-icon-light.png')
        : require('@/assets/images/splash-icon-dark.png'),
    [colorScheme],
  );

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

  const onLikePressed = useCallback(
    (projId: string) => {
      toggleFavorite(projId);
    },
    [toggleFavorite],
  );

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
        label: 'Bills',
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
      } else if (item === 'About') {
        router.push({ pathname: '/(protected)/(home)/about' });
      } else if (item === 'ImportQBAccounts') {
        // Import QuickBooks accounts
        try {
          const qbAccounts = await fetchAccounts(auth.orgId!, auth.userId!, auth.getToken);
          let addedCount = 0;
          let updatedCount = 0;

          for (const qbAccount of qbAccounts) {
            // Find existing account with matching accountingId
            const existing = allAccounts.find((a) => a.accountingId === qbAccount.id);

            if (existing) {
              // Update existing account
              const accountData: AccountData = {
                id: existing.id,
                accountingId: qbAccount.id,
                name: qbAccount.name,
                // Store classification if available (for expense accounts), otherwise accountType (for payment accounts)
                accountType: qbAccount.classification || qbAccount.accountType || '',
              };
              updateAccount(existing.id, accountData);
              updatedCount++;
            } else {
              // Add new account (id will be generated automatically)
              const accountData: Omit<AccountData, 'id'> = {
                accountingId: qbAccount.id,
                name: qbAccount.name,
                // Store classification if available (for expense accounts), otherwise accountType (for payment accounts)
                accountType: qbAccount.classification || qbAccount.accountType || '',
              };
              addAccount(accountData as AccountData);
              addedCount++;
            }
          }

          Alert.alert(
            'QuickBooks Account Import Complete',
            `Accounts imported successfully from QuickBooks.\nAdded: ${addedCount}\nUpdated: ${updatedCount}`,
          );
        } catch (error) {
          console.error('Error importing QuickBooks accounts:', error);
          Alert.alert('Error', 'Failed to import QuickBooks accounts');
        }
      } else if (item === 'Logout') {
        await signOut();
      }
    },
    [router, signOut, auth, allAccounts, addAccount, updateAccount],
  );

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
      ...(isConnectedToQuickBooks
        ? [
            {
              icon: <SvgImage fileName="qb-logo" width={28} height={28} />,
              label: 'Import Accounts from QuickBooks',
              onPress: (e, actionContext) => {
                handleMenuItemPress('ImportQBAccounts', actionContext);
              },
            } as ActionButtonProps,
          ]
        : []),
      {
        icon: <AntDesign name="info-circle" size={28} color={colors.iconColor} />,
        label: 'About',
        onPress: (e, actionContext) => {
          handleMenuItemPress('About', actionContext);
        },
      },
      {
        icon: <Entypo name="log-out" size={28} color={colors.iconColor} />,
        label: 'Logout',
        onPress: async (e, actionContext) => {
          handleMenuItemPress('Logout', actionContext);
        },
      },
    ];
    return menuButtons;
  }, [colors, handleMenuItemPress, allCategories, orgId, orgRole, isConnectedToQuickBooks]);

  const headerRightComponent = useMemo(() => {
    return {
      headerRight: () => (
        <View
          style={{
            minWidth: 30,
            minHeight: 30,
            gap: 16,
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: 'transparent',
            marginRight: Platform.OS === 'android' ? 16 : 0,
          }}
        >
          {isConnectedToQuickBooks && <SvgImage fileName="qb-logo" width={26} height={26} />}
          <Pressable
            style={{ alignItems: 'center' }}
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
  }, [colors.iconColor, headerMenuModalVisible, setHeaderMenuModalVisible, isConnectedToQuickBooks]);

  const minConfigMet: boolean = useMemo(
    () => {
      return allVisibleCategories && allVisibleCategories.length > 0;
    } /* && allProjectTemplates && allProjectTemplates.length > 0 */,
    [allVisibleCategories],
  );

  useEffect(() => {
    if (minConfigMet) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [minConfigMet]);

  // Handle onboarding redirect if app settings not met
  useEffect(() => {
    if (!minAppSettingsMet && !isLoading) {
      router.replace('/appSettings/SetAppSettings');
    }
  }, [minAppSettingsMet, isLoading, router]);

  // wait for up to a 2 seconds to allow tinybase to load and synch data.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.iconColor} />
        <Text txtSize="title" style={{ marginTop: 16 }}>
          Loading configuration...
        </Text>
        <Image source={splashImage} style={styles.splashImage} contentFit="contain" />
      </View>
    );
  }

  // Guard: show onboarding screen if app settings not complete
  if (!minAppSettingsMet) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Company Setup Required',
            headerLeft: () => null,
          }}
        />
        <View style={[styles.container, { padding: 20, backgroundColor: colors.background }]}>
          <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <Text text="Welcome!" txtSize="xl" />
          </View>
          <Text
            style={{ marginBottom: 20, textAlign: 'center' }}
            text="Before we can get started, we need some basic information about your company."
          />
          <ActionButton
            style={{ zIndex: 1, marginTop: 20, width: '95%', maxWidth: 400, alignSelf: 'center' }}
            onPress={() => router.push('/appSettings/SetAppSettings')}
            type="action"
            title="Complete Company Setup"
          />
        </View>
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
                  style={{ marginBottom: 10 }}
                  text="Before we can start helping you manage project costs we must know what cost items you want to track."
                />
                <Text
                  style={{ marginBottom: 10 }}
                  text="You can import your own work items, choose one we provide, or manually create your own within this application."
                />
                <Text
                  style={{ marginBottom: 10 }}
                  text="If you want to get more information on how to set up your cost items please visit our support site."
                />
                <ActionButton
                  style={{ zIndex: 1, marginTop: 10, width: '95%', maxWidth: 400 }}
                  onPress={async () =>
                    await WebBrowser.openBrowserAsync(
                      `${DOCS_URL}/configuration/vendors-suppliers/index.html`,
                    )
                  } //Linking.openURL(`${DOCS_URL}/setup`)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoColListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  splashImage: {
    width: 300,
    height: 300,
    marginTop: 40,
  },
});
