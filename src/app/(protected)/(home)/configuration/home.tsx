import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { Stack, useRouter } from 'expo-router';
import { Paths, File } from 'expo-file-system';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  WorkItemDataCodeCompareAsNumber,
  CustomerDataCompareName,
  VendorDataCompareName,
  useConfigurationStore,
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
import { SvgImage } from '@/src/components/SvgImage';
import { ActionButton } from '@/src/components/ActionButton';
import {
  connectToQuickBooks as qbConnect,
  disconnectQuickBooks as qbDisconnect,
  fetchCompanyInfo,
  isQuickBooksConnected,
} from '@/src/utils/quickbooksAPI';
import * as WebBrowser from 'expo-web-browser';

const isPowerUser = false;

const Home = () => {
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });

  const isProcessingRef = useRef(false);
  const startProcessing = useCallback((label: string) => {
    console.log(`[Config] startProcessing: ${label}`);
    isProcessingRef.current = true;
    setProcessingInfo({ isProcessing: true, label });
  }, []);
  const stopProcessing = useCallback(() => {
    console.log('[Config] stopProcessing');
    isProcessingRef.current = false;
    setProcessingInfo({ isProcessing: false, label: '' });
  }, []);
  const router = useRouter();
  const colors = useColors();
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);
  const allProjectTemplates = useAllRows('templates');
  const allVendors = useAllRows('vendors', VendorDataCompareName);
  const cleanupOrphanedWorkItems = useCleanOrphanedWorkItemsCallback();
  const exportConfiguration = useExportStoreDataCallback();
  const importConfiguration = useImportJsonConfigurationDataCallback();
  const addVendorToStore = useAddRowCallback('vendors');
  const updateVendor = useUpdateRowCallback('vendors');
  const deleteVendor = useDeleteRowCallback('vendors');
  const allAccounts = useAllRows('accounts');
  const addAccount = useAddRowCallback('accounts');
  const deleteAccount = useDeleteRowCallback('accounts');
  const allCustomers = useAllRows('customers', CustomerDataCompareName);
  const addCustomer = useAddRowCallback('customers');
  const updateCustomer = useUpdateRowCallback('customers');
  const configStore = useConfigurationStore();
  const { isQuickBooksAccessible, isQuickBooksConnected: isQBConnected } = useNetwork();
  const auth = useAuth();
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();

  const checkQBConnectionWithRetry = useCallback(
    async (maxRetries = 60, retryInterval = 1000): Promise<boolean> => {
      if (!auth.orgId || !auth.userId) {
        console.error('Cannot check QB connection: missing orgId or userId');
        return false;
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          const connected = await isQuickBooksConnected(auth.orgId, auth.userId, auth.getToken);
          if (connected) {
            return true;
          }
        } catch (error) {
          console.error(`Error checking QB connection (attempt ${attempt + 1}/${maxRetries}):`, error);
        }
      }

      return false;
    },
    [auth],
  );

  const handleDisconnectFromQuickBooks = useCallback(() => {
    if (!auth.orgId || !auth.userId) {
      Alert.alert('Error', 'Authentication required to disconnect from QuickBooks');
      return;
    }

    Alert.alert('Disconnect QuickBooks', 'Are you sure you want to disconnect from QuickBooks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          startProcessing('Disconnecting from QuickBooks...');
          try {
            const token = await auth.getToken();
            if (!token) {
              Alert.alert('Error', 'Unable to obtain authentication token');
              return;
            }

            await qbDisconnect(auth.orgId!, auth.userId!, auth.getToken);
            setAppSettings({ syncWithQuickBooks: false });
            Alert.alert('Success', 'Successfully disconnected from QuickBooks');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Error', `Failed to disconnect from QuickBooks: ${errorMessage}`);
          } finally {
            stopProcessing();
          }
        },
      },
    ]);
  }, [auth, setAppSettings, startProcessing, stopProcessing]);

  const handleLoadCompanyInfoFromQuickBooks = useCallback(
    async (showAlert = true) => {
      if (!auth.orgId || !auth.userId) {
        Alert.alert('Error', 'Authentication required to fetch company information');
        return;
      }

      startProcessing('Loading Company Settings...');
      try {
        let companyInfo;
        const maxRetries = 5;
        const retryInterval = 1000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((resolve) => setTimeout(resolve, retryInterval));
            }
            companyInfo = await fetchCompanyInfo(auth.orgId, auth.userId, auth.getToken);
            break;
          } catch (error) {
            if (attempt === maxRetries - 1) {
              throw error;
            }
          }
        }

        if (!companyInfo) {
          throw new Error('Failed to fetch company information after all retries');
        }

        setAppSettings({
          ...(companyInfo.companyName ? { companyName: companyInfo.companyName } : {}),
          ...(companyInfo.address ? { address: companyInfo.address } : {}),
          ...(companyInfo.address2 ? { address2: companyInfo.address2 } : {}),
          ...(companyInfo.city ? { city: companyInfo.city } : {}),
          ...(companyInfo.state ? { state: companyInfo.state } : {}),
          ...(companyInfo.zip ? { zip: companyInfo.zip } : {}),
          ...(companyInfo.email ? { email: companyInfo.email } : {}),
          ...(companyInfo.phone ? { phone: companyInfo.phone } : {}),
        });
        if (showAlert) {
          Alert.alert('Success', 'Company info loaded from QuickBooks.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (showAlert) {
          Alert.alert('Error', `Failed to fetch company information: ${errorMessage}`);
        }
      } finally {
        stopProcessing();
      }
    },
    [auth, setAppSettings, startProcessing, stopProcessing],
  );

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
            gap: 10,
            flexDirection: 'row',
            backgroundColor: 'transparent',
            marginRight: Platform.OS === 'android' ? 16 : 0,
          }}
        >
          {isQuickBooksAccessible && <SvgImage fileName="qb-logo" width={26} height={26} />}
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
  }, [colors.iconColor, headerMenuModalVisible, setHeaderMenuModalVisible, isQuickBooksAccessible]);

  const handleExportConfiguration = useCallback(async () => {
    Alert.alert('Export Configuration Data', 'Would you like to export all configuration data?', [
      { text: 'Cancel', style: 'cancel' },
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
  }, [exportConfiguration, startProcessing, stopProcessing]);

  const handleImportConfiguration = useCallback(async () => {
    Alert.alert('Import Configuration Data', 'Would you like to import configuration from a JSON file?', [
      { text: 'Cancel', style: 'cancel' },
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
  }, [importConfiguration, startProcessing, stopProcessing]);

  const handleCleanWorkItems = useCallback(() => {
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
  }, [cleanupOrphanedWorkItems]);

  const handleExportVendors = useCallback(async () => {
    Alert.alert('Export Vendors', 'Would you like to export all vendors to a CSV file?', [
      { text: 'Cancel', style: 'cancel' },
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
  }, [allVendors, startProcessing, stopProcessing]);

  const handleImportVendors = useCallback(async () => {
    Alert.alert('Import Vendors', 'Would you like to import vendors from a CSV file?', [
      { text: 'Cancel', style: 'cancel' },
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

              configStore?.startTransaction();
              try {
                for (const vendor of importedVendors) {
                  const existing = allVendors.find((v) => {
                    const nameMatch = v.name && vendor.name && v.name === vendor.name;
                    const addressMatch = v.address && vendor.address && v.address === vendor.address;
                    return nameMatch && addressMatch;
                  });

                  if (existing) {
                    updateVendor(existing.id, vendor);
                    updatedCount++;
                  } else {
                    addVendorToStore(vendor as VendorData);
                    addedCount++;
                  }
                }
              } finally {
                configStore?.finishTransaction();
              }

              console.log(`[CSV Import Vendors] Done — added ${addedCount}, updated ${updatedCount}`);
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
  }, [allVendors, addVendorToStore, updateVendor, configStore]);

  const handleGetQBVendors = useCallback(
    async (showAlert = true) => {
      if (!auth.orgId || !auth.userId) {
        Alert.alert('Error', 'Unable to import vendors. Please sign in again.');
        return;
      }
      if (showAlert && isProcessingRef.current) {
        console.warn('[QB Import Vendors] Skipped — already processing');
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
          configStore,
        );

        if (showAlert) {
          Alert.alert(
            'QuickBooks Vendor Import Complete',
            `${addedCount} Vendors imported successfully from QuickBooks.`,
          );
        }
      } catch (error) {
        console.error('Error importing vendors from QuickBooks:', error);
        if (showAlert) {
          Alert.alert('Error', 'Failed to import vendors from QuickBooks');
        }
      } finally {
        stopProcessing();
      }
    },
    [
      auth.orgId,
      auth.userId,
      auth.getToken,
      allVendors,
      addVendorToStore,
      deleteVendor,
      configStore,
      startProcessing,
      stopProcessing,
    ],
  );

  const handleGetQBAccounts = useCallback(
    async (showAlert = true) => {
      if (!auth.orgId || !auth.userId) {
        Alert.alert('Error', 'Unable to get accounts. Please sign in again.');
        return;
      }
      if (showAlert && isProcessingRef.current) {
        console.warn('[QB Get Accounts] Skipped — already processing');
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
          configStore,
        );

        const sanitizedSettings = sanitizeQuickBooksAccountSettings(appSettings, accounts);
        setAppSettings(sanitizedSettings);

        if (showAlert) {
          Alert.alert(
            'QuickBooks Account Import Complete',
            `${addedCount} Accounts imported successfully from QuickBooks.`,
          );
        }
      } catch (error) {
        console.error('Error importing QuickBooks accounts:', error);
        if (showAlert) {
          Alert.alert('Error', 'Failed to import QuickBooks accounts');
        }
      } finally {
        stopProcessing();
      }
    },
    [
      auth.orgId,
      auth.userId,
      auth.getToken,
      allAccounts,
      addAccount,
      deleteAccount,
      configStore,
      appSettings,
      setAppSettings,
      startProcessing,
      stopProcessing,
    ],
  );

  const handleGetQBCustomers = useCallback(
    async (showAlert = true) => {
      if (!auth.orgId || !auth.userId) {
        Alert.alert('Error', 'Unable to import customers. Please sign in again.');
        return;
      }
      if (showAlert && isProcessingRef.current) {
        console.warn('[QB Import Customers] Skipped — already processing');
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
          configStore,
        );

        if (showAlert) {
          Alert.alert(
            'QuickBooks Customer Import Complete',
            `${addedCount} Customers added, ${updatedCount} updated from QuickBooks.`,
          );
        }
      } catch (error) {
        console.error('Error importing customers from QuickBooks:', error);
        if (showAlert) {
          Alert.alert('Error', 'Failed to import customers from QuickBooks');
        }
      } finally {
        stopProcessing();
      }
    },
    [
      auth.orgId,
      auth.userId,
      auth.getToken,
      allCustomers,
      addCustomer,
      updateCustomer,
      configStore,
      startProcessing,
      stopProcessing,
    ],
  );

  const handleImportCustomers = useCallback(async () => {
    Alert.alert('Import Customers', 'Would you like to import customers from a CSV file?', [
      { text: 'Cancel', style: 'cancel' },
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

              configStore?.startTransaction();
              try {
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
              } finally {
                configStore?.finishTransaction();
              }

              console.log(`[CSV Import Customers] Done — added ${addedCount}, updated ${updatedCount}`);
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
  }, [allCustomers, addCustomer, updateCustomer, configStore]);

  const handleConnectToQuickBooks = useCallback(async () => {
    if (!auth.orgId || !auth.userId) {
      Alert.alert('Error', 'Authentication required to connect to QuickBooks');
      return;
    }

    startProcessing('Connecting to QuickBooks...');
    try {
      const token = await auth.getToken();
      if (!token) {
        Alert.alert('Error', 'Unable to obtain authentication token');
        return;
      }

      const { authUrl } = await qbConnect(auth.orgId, auth.userId, auth.getToken);
      if (!authUrl) {
        Alert.alert('Error', 'No authorization URL received from server');
        return;
      }

      const result = await WebBrowser.openBrowserAsync(authUrl);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        const connected = await checkQBConnectionWithRetry();
        if (connected) {
          setAppSettings({ syncWithQuickBooks: true });
          await handleLoadCompanyInfoFromQuickBooks(false);
          await handleGetQBAccounts(false);
          await handleGetQBVendors(false);
          await handleGetQBCustomers(false);
          Alert.alert(
            'Success',
            'Successfully connected to QuickBooks and imported company info, accounts, vendors, and customers.',
          );
        } else {
          Alert.alert('Not Connected', 'QuickBooks connection could not be verified.');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to connect to QuickBooks: ${errorMessage}`);
    } finally {
      stopProcessing();
    }
  }, [
    auth,
    checkQBConnectionWithRetry,
    setAppSettings,
    startProcessing,
    stopProcessing,
    handleLoadCompanyInfoFromQuickBooks,
    handleGetQBAccounts,
    handleGetQBVendors,
    handleGetQBCustomers,
  ]);

  const handleMenuItemPress = useCallback(
    async (menuItem: string) => {
      setHeaderMenuModalVisible(false);
      if (isPowerUser) {
        if (menuItem === 'Export') {
          handleExportConfiguration();
          return;
        } else if (menuItem === 'Import') {
          handleImportConfiguration();
          return;
        }
      }
      if (menuItem === 'CleanWorkItems') {
        handleCleanWorkItems();
        return;
      }
      if (menuItem === 'ExportVendors') {
        handleExportVendors();
        return;
      }
      if (menuItem === 'ImportVendors') {
        handleImportVendors();
        return;
      }
      if (menuItem === 'GetQBVendors') {
        handleGetQBVendors();
        return;
      }
      if (menuItem === 'GetQBAccounts') {
        handleGetQBAccounts();
        return;
      }
      if (menuItem === 'GetQBCustomers') {
        handleGetQBCustomers();
        return;
      }
      if (menuItem === 'ImportCustomers') {
        handleImportCustomers();
        return;
      }
      if (menuItem === 'DisconnectQuickBooks') {
        handleDisconnectFromQuickBooks();
        return;
      }
      if (menuItem === 'LoadCompanyInfo') {
        handleLoadCompanyInfoFromQuickBooks();
        return;
      }
    },
    [
      handleExportConfiguration,
      handleImportConfiguration,
      handleCleanWorkItems,
      handleExportVendors,
      handleImportVendors,
      handleGetQBVendors,
      handleGetQBAccounts,
      handleGetQBCustomers,
      handleImportCustomers,
      handleDisconnectFromQuickBooks,
      handleLoadCompanyInfoFromQuickBooks,
    ],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(() => {
    const menuButtons: ActionButtonProps[] = [
      ...(hasConfigurationData && isPowerUser
        ? [
            {
              icon: <MaterialCommunityIcons name="export" size={28} color={colors.iconColor} />,
              label: 'Export Configuration Data',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('Export');
              },
            },
          ]
        : []),
      ...(isPowerUser
        ? [
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Configuration Data',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('Import');
              },
            },
          ]
        : []),
      ...(isQuickBooksAccessible
        ? [
            {
              icon: <MaterialCommunityIcons name="cloud-download" size={28} color={colors.iconColor} />,
              label: 'Load Company Info from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('LoadCompanyInfo');
              },
            },

            {
              icon: <MaterialCommunityIcons name="account-supervisor" size={28} color={colors.iconColor} />,
              label: 'Get Vendors from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('GetQBVendors');
              },
            },
            {
              icon: <MaterialCommunityIcons name="account-group" size={28} color={colors.iconColor} />,
              label: 'Get Customers from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('GetQBCustomers');
              },
            },

            {
              icon: <MaterialIcons name="account-balance" size={28} color={colors.iconColor} />,
              label: 'Get Accounts from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('GetQBAccounts');
              },
            },
            {
              icon: <MaterialCommunityIcons name="link-off" size={28} color={colors.iconColor} />,
              label: 'Disconnect from QuickBooks',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('DisconnectQuickBooks');
              },
            },
          ]
        : []),
      ...(!isQBConnected
        ? [
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Vendors',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ImportVendors');
              },
            },
            {
              icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
              label: 'Import Customers from CSV',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ImportCustomers');
              },
            },
          ]
        : []),
      ...(!isQBConnected && hasVendorData
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
    ];
    return menuButtons;
  }, [
    colors,
    handleMenuItemPress,
    hasConfigurationData,
    hasVendorData,
    isQuickBooksAccessible,
    isQBConnected,
  ]);

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
        {!isQuickBooksAccessible && (
          <View style={{ marginBottom: 10, marginTop: 4 }}>
            <ActionButton type="action" title="Connect to QuickBooks" onPress={handleConnectToQuickBooks} />
          </View>
        )}

        <ConfigurationEntry
          label="Company Settings"
          description="Update company profile and defaults"
          onPress={() => router.push('/appSettings/SetAppSettings')}
        />

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
          label="Vendors"
          description="Add and Edit Vendors"
          onPress={() => router.push('/configuration/vendor/vendors')}
        />
        <ConfigurationEntry
          label="Customers"
          description="Add and Edit Customers"
          onPress={() => router.push('/configuration/customer/customers')}
        />
        {isQuickBooksAccessible && (
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
