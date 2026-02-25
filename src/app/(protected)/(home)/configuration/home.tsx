import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { Stack, useRouter } from 'expo-router';
import { Paths, File } from 'expo-file-system';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native-gesture-handler';
import * as Sharing from 'expo-sharing';
import { ActivityIndicator, Alert, GestureResponderEvent, Modal, Platform, StyleSheet } from 'react-native';
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
import { vendorsToCsv, csvToVendors, csvToCustomers } from '@/src/utils/csvUtils';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@clerk/clerk-expo';
import {
  importAccountsFromQuickBooks,
  importCustomersFromQuickBooks,
  importVendorsFromQuickBooks,
} from '@/src/utils/quickbooksImports';
import {
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { sanitizeQuickBooksAccountSettings } from '@/src/utils/quickbooksAccountSettings';

const Home = () => {
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });

  const startProcessing = useCallback(
    (label: string) => setProcessingInfo({ isProcessing: true, label }),
    [],
  );
  const stopProcessing = useCallback(() => setProcessingInfo({ isProcessing: false, label: '' }), []);
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
  const allCustomers = useAllRows('customers');
  const addCustomer = useAddRowCallback('customers');
  const updateCustomer = useUpdateRowCallback('customers');
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
              startProcessing('Exporting Configuration Data...');
              try {
                const jsonData = exportConfiguration();
                const jsonText = JSON.stringify(jsonData);
                const outputFile = new File(Paths.document, 'ProjectHoundConfig.json');
                outputFile.write(jsonText);
                const outputPath = outputFile.uri;
                const isAvailable = await Sharing.isAvailableAsync();
                stopProcessing();
                if (isAvailable) {
                  await Sharing.shareAsync(outputPath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Share Configuration Data',
                    UTI: 'public.json',
                  });
                }
              } catch (err) {
                console.log(err);
                stopProcessing();
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
                  startProcessing('Importing Configuration Data...');
                  try {
                    const file = result.assets[0];
                    const fileObj = new File(file.uri);
                    const fileText = await fileObj.text();
                    const jsonData = JSON.parse(fileText);
                    importConfiguration(jsonData);
                  } finally {
                    stopProcessing();
                  }
                  alert('Configuration Data Import Complete');
                }
              } catch (error) {
                console.error('Error picking document:', error);
                stopProcessing();
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
              startProcessing('Exporting Vendors...');
              try {
                const csvData = vendorsToCsv(allVendors);
                const outputFile = new File(Paths.document, 'vendors.csv');
                outputFile.write(csvData);
                const outputPath = outputFile.uri;
                const isAvailable = await Sharing.isAvailableAsync();
                stopProcessing();
                if (isAvailable) {
                  await Sharing.shareAsync(outputPath, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Share Vendors CSV',
                    UTI: 'public.comma-separated-values-text',
                  });
                }
              } catch (err) {
                console.error('Error exporting vendors:', err);
                stopProcessing();
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

        startProcessing('Importing Vendors from QuickBooks...');
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
        } finally {
          stopProcessing();
        }
      } else if (menuItem === 'ImportQBAccounts') {
        // Import QuickBooks accounts
        if (!auth.orgId || !auth.userId) {
          Alert.alert('Error', 'Unable to import accounts. Please sign in again.');
          return;
        }

        startProcessing('Importing Accounts from QuickBooks...');
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
        } finally {
          stopProcessing();
        }
      } else if (menuItem === 'GetQBCustomers') {
        if (!auth.orgId || !auth.userId) {
          Alert.alert('Error', 'Unable to import customers. Please sign in again.');
          return;
        }

        startProcessing('Importing Customers from QuickBooks...');
        try {
          const { addedCount, updatedCount } = await importCustomersFromQuickBooks(
            auth.orgId,
            auth.userId,
            auth.getToken,
            allCustomers,
            addCustomer,
            updateCustomer,
          );

          Alert.alert(
            'QuickBooks Customer Import Complete',
            `${addedCount} Customers added, ${updatedCount} updated from QuickBooks.`,
          );
        } catch (error) {
          console.error('Error importing customers from QuickBooks:', error);
          Alert.alert('Error', 'Failed to import customers from QuickBooks');
        } finally {
          stopProcessing();
        }
      } else if (menuItem === 'ImportCustomers') {
        Alert.alert('Import Customers', 'Would you like to import customers from a CSV file?', [
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
                  const importedCustomers = csvToCustomers(fileText);

                  let addedCount = 0;
                  let updatedCount = 0;

                  for (const c of importedCustomers) {
                    const existing = allCustomers.find(
                      (ec) => ec.name && c.name && ec.name === c.name && (!c.email || ec.email === c.email),
                    );

                    if (existing) {
                      updateCustomer(existing.id, c);
                      updatedCount++;
                    } else {
                      addCustomer({ id: '', accountingId: '', ...c });
                      addedCount++;
                    }
                  }

                  Alert.alert(
                    'Import Complete',
                    `Customers imported successfully.\nAdded: ${addedCount}\nUpdated: ${updatedCount}`,
                  );
                }
              } catch (error) {
                console.error('Error importing customers:', error);
                Alert.alert('Error', 'Failed to import customers');
              }
            },
          },
        ]);
        return;
      }
    },
    [
      exportConfiguration,
      importConfiguration,
      allVendors,
      addVendorToStore,
      updateVendor,
      cleanupOrphanedWorkItems,
      startProcessing,
      stopProcessing,
      allAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
      allCustomers,
      addCustomer,
      updateCustomer,
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
            {
              icon: <MaterialCommunityIcons name="account-group" size={28} color={colors.iconColor} />,
              label: 'Get Customers from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('GetQBCustomers');
              },
            },
          ]
        : []),
      ...(!isConnectedToQuickBooks
        ? [
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Customers from CSV',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ImportCustomers');
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
        <ConfigurationEntry
          label="Customers"
          description="Add and Edit Customers"
          onPress={() => router.push('/configuration/customer/customers')}
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
      <Modal transparent animationType="fade" visible={processingInfo.isProcessing}>
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.processingLabel}>{processingInfo.label}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Home;
