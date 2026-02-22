import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { Stack, useRouter } from 'expo-router';
import { Paths, File } from 'expo-file-system';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native-gesture-handler';
import * as Sharing from 'expo-sharing';
import { Alert, GestureResponderEvent, Platform } from 'react-native';
import {
  useExportStoreDataCallback,
  useImportJsonConfigurationDataCallback,
  useAllRows,
  WorkCategoryCodeCompareAsNumber,
  useCleanOrphanedWorkItemsCallback,
  useAddRowCallback,
  useUpdateRowCallback,
  useDeleteRowCallback,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { vendorsToCsv, csvToVendors } from '@/src/utils/csvUtils';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@clerk/clerk-expo';
import { importAccountsFromQuickBooks, importVendorsFromQuickBooks } from '@/src/utils/quickbooksImports';
import {
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { sanitizeQuickBooksAccountSettings } from '@/src/utils/quickbooksAccountSettings';

const Home = () => {
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const router = useRouter();
  const colors = useColors();
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems');
  const allProjectTemplates = useAllRows('templates');
  const allVendors = useAllRows('vendors');
  const cleanupOrphanedWorkItems = useCleanOrphanedWorkItemsCallback();
  const exportConfiguration = useExportStoreDataCallback();
  const importConfiguration = useImportJsonConfigurationDataCallback();
  const addVendorToStore = useAddRowCallback('vendors');
  const updateVendor = useUpdateRowCallback('vendors');
  const deleteVendor = useDeleteRowCallback('vendors');
  const allAccounts = useAllRows('accounts');
  const addAccount = useAddRowCallback('accounts');
  const updateAccount = useUpdateRowCallback('accounts');
  const deleteAccount = useDeleteRowCallback('accounts');
  const { isConnectedToQuickBooks } = useNetwork();
  const auth = useAuth();
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();

  const hasConfigurationData: boolean = useMemo(
    () =>
      (allCategories && allCategories.length > 0) ||
      (allProjectTemplates && allProjectTemplates.length > 0) ||
      (allWorkItems && allWorkItems.length > 0),
    [allCategories, allWorkItems, allProjectTemplates],
  );

  const hasVendorData: boolean = useMemo(() => allVendors && allVendors.length > 0, [allVendors]);

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

  const handleMenuItemPress = useCallback(
    async (menuItem: string) => {
      setHeaderMenuModalVisible(false);

      if (menuItem === 'Export') {
        Alert.alert('Export Configuration Data', 'Would you like to export all configuration data?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const jsonData = exportConfiguration();
                const jsonText = JSON.stringify(jsonData);
                const outputFile = new File(Paths.document, 'ProjectHoundConfig.json');
                outputFile.write(jsonText);
                const outputPath = outputFile.uri;
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(outputPath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Share Configuration Data',
                    UTI: 'public.json',
                  });
                }
              } catch (err) {
                console.log(err);
              }
            },
          },
        ]);
        return;
      } else if (menuItem === 'Import') {
        Alert.alert('Import Configuration Data', 'Would you like to import configuration from a JSON file?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: ['application/json', 'text/json', '*/*'],
                  copyToCacheDirectory: true,
                  multiple: false,
                });

                if (!result.canceled && result.assets?.length > 0) {
                  const file = result.assets[0];
                  const fileObj = new File(file.uri);
                  const fileText = await fileObj.text();
                  const jsonData = JSON.parse(fileText);
                  importConfiguration(jsonData);
                  alert('Configuration Data Import Complete');
                }
              } catch (error) {
                console.error('Error picking document:', error);
              }
            },
          },
        ]);
        return;
      } else if (menuItem === 'CleanWorkItems') {
        Alert.alert(
          'Clean Work Items',
          'This processing will verify that work items are properly linked to a category. It also validates that a template does not reference a work item that no longer exist. Please confirm you want to do this clean up.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clean-up',
              onPress: () => {
                try {
                  cleanupOrphanedWorkItems();
                } catch (error) {
                  console.error('Error during work item cleanup:', error);
                }
              },
            },
          ],
        );
        return;
      } else if (menuItem === 'ExportVendors') {
        Alert.alert('Export Vendors', 'Would you like to export all vendors to a CSV file?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const csvData = vendorsToCsv(allVendors);
                const outputFile = new File(Paths.document, 'vendors.csv');
                outputFile.write(csvData);
                const outputPath = outputFile.uri;
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(outputPath, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Share Vendors CSV',
                    UTI: 'public.comma-separated-values-text',
                  });
                }
              } catch (err) {
                console.error('Error exporting vendors:', err);
                Alert.alert('Error', 'Failed to export vendors');
              }
            },
          },
        ]);
        return;
      } else if (menuItem === 'ImportVendors') {
        Alert.alert('Import Vendors', 'Would you like to import vendors from a CSV file?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: ['text/csv', 'text/comma-separated-values', '*/*'],
                  copyToCacheDirectory: true,
                  multiple: false,
                });

                if (!result.canceled && result.assets?.length > 0) {
                  const file = result.assets[0];
                  const fileObj = new File(file.uri);
                  const fileText = await fileObj.text();
                  const importedVendors = csvToVendors(fileText);

                  let addedCount = 0;
                  let updatedCount = 0;

                  for (const vendor of importedVendors) {
                    // Find existing vendor with matching name and address
                    // Ensure both name and address have meaningful values for matching
                    const existing = allVendors.find((v) => {
                      const nameMatch = v.name && vendor.name && v.name === vendor.name;
                      const addressMatch = v.address && vendor.address && v.address === vendor.address;
                      return nameMatch && addressMatch;
                    });

                    if (existing) {
                      // Update existing vendor
                      updateVendor(existing.id, vendor);
                      updatedCount++;
                    } else {
                      // Add new vendor
                      addVendorToStore(vendor as VendorData);
                      addedCount++;
                    }
                  }

                  Alert.alert(
                    'Import Complete',
                    `Vendors imported successfully.\nAdded: ${addedCount}\nUpdated: ${updatedCount}`,
                  );
                }
              } catch (error) {
                console.error('Error importing vendors:', error);
                Alert.alert('Error', 'Failed to import vendors');
              }
            },
          },
        ]);
        return;
      } else if (menuItem === 'GetQBVendors') {
        if (!auth.orgId || !auth.userId) {
          Alert.alert('Error', 'Unable to import vendors. Please sign in again.');
          return;
        }

        try {
          const { addedCount } = await importVendorsFromQuickBooks(
            auth.orgId!,
            auth.userId!,
            auth.getToken,
            allVendors,
            addVendorToStore,
            deleteVendor,
          );

          Alert.alert(
            'QuickBooks Vendor Import Complete',
            `${addedCount} Vendors imported successfully from QuickBooks.`,
          );
        } catch (error) {
          console.error('Error importing vendors from QuickBooks:', error);
          Alert.alert('Error', 'Failed to import vendors from QuickBooks');
        }
      } else if (menuItem === 'ImportQBAccounts') {
        // Import QuickBooks accounts
        if (!auth.orgId || !auth.userId) {
          Alert.alert('Error', 'Unable to import accounts. Please sign in again.');
          return;
        }

        try {
          const { addedCount, accounts } = await importAccountsFromQuickBooks(
            auth.orgId,
            auth.userId,
            auth.getToken,
            allAccounts,
            addAccount,
            deleteAccount,
          );

          const sanitizedSettings = sanitizeQuickBooksAccountSettings(appSettings, accounts);
          setAppSettings({ ...appSettings, ...sanitizedSettings });

          Alert.alert(
            'QuickBooks Account Import Complete',
            `${addedCount} Accounts imported successfully from QuickBooks.`,
          );
        } catch (error) {
          console.error('Error importing QuickBooks accounts:', error);
          Alert.alert('Error', 'Failed to import QuickBooks accounts');
        }
      }
    },
    [
      exportConfiguration,
      importConfiguration,
      allVendors,
      addVendorToStore,
      updateVendor,
      cleanupOrphanedWorkItems,
      allAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
      auth.orgId,
      auth.userId,
      auth.getToken,
      appSettings,
      setAppSettings,
    ],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(() => {
    const menuButtons: ActionButtonProps[] = [
      ...(hasConfigurationData
        ? [
            {
              icon: <MaterialCommunityIcons name="export" size={28} color={colors.iconColor} />,
              label: 'Export Configuration Data',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('Export');
              },
            },
          ]
        : [
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Configuration Data',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('Import');
              },
            },
          ]),
      ...(!isConnectedToQuickBooks && hasVendorData
        ? [
            {
              icon: <MaterialCommunityIcons name="export" size={28} color={colors.iconColor} />,
              label: 'Export Vendors',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ExportVendors');
              },
            },
          ]
        : []),
      ...(!isConnectedToQuickBooks
        ? [
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Vendors',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ImportVendors');
              },
            },
          ]
        : []),
      ...(isConnectedToQuickBooks
        ? [
            {
              icon: <MaterialCommunityIcons name="account-supervisor" size={28} color={colors.iconColor} />,
              label: 'Get Vendors from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('GetQBVendors');
              },
            },
            {
              icon: <MaterialIcons name="account-balance" size={28} color={colors.iconColor} />,
              label: 'Import Accounts from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ImportQBAccounts');
              },
            },
          ]
        : []),
    ];
    return menuButtons;
  }, [colors, handleMenuItemPress, hasConfigurationData, hasVendorData, isConnectedToQuickBooks]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          ...headerRightComponent,
        }}
      />

      <View style={{ flex: 1, width: '100%', paddingHorizontal: 10, backgroundColor: colors.listBackground }}>
        <ConfigurationEntry
          label="Categories"
          description="Manage cost categories"
          onPress={() => router.push('/configuration/workcategory/workCategories')}
        />
        <ConfigurationEntry
          label="Project Templates"
          description="Define Project-specific Cost Items"
          onPress={() => router.push('/configuration/template/templates')}
        />
        <ConfigurationEntry
          label="Vendors/Merchants"
          description="Add and Edit Vendors/Merchants"
          onPress={() => router.push('/configuration/vendor/vendors')}
        />
        {isConnectedToQuickBooks && (
          <ConfigurationEntry
            label="QuickBooks Accounts"
            description="Define accounts to use"
            onPress={() => router.push('/configuration/quickbooks/qbaccounts')}
          />
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
};

export default Home;
