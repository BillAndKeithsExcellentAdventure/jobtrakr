import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  VendorData,
  SupplierData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { vendorsToCsv, suppliersToCsv, csvToVendors, csvToSuppliers } from '@/src/utils/csvUtils';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import * as DocumentPicker from 'expo-document-picker';

const Home = () => {
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const router = useRouter();
  const colors = useColors();
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems');
  const allProjectTemplates = useAllRows('templates');
  const allVendors = useAllRows('vendors');
  const allSuppliers = useAllRows('suppliers');
  const cleanupOrphanedWorkItems = useCleanOrphanedWorkItemsCallback();
  const exportConfiguration = useExportStoreDataCallback();
  const importConfiguration = useImportJsonConfigurationDataCallback();
  const addVendorToStore = useAddRowCallback('vendors');
  const updateVendor = useUpdateRowCallback('vendors');
  const addSupplierToStore = useAddRowCallback('suppliers');
  const updateSupplier = useUpdateRowCallback('suppliers');
  const hasConfigurationData: boolean = useMemo(
    () =>
      (allCategories && allCategories.length > 0) ||
      (allProjectTemplates && allProjectTemplates.length > 0) ||
      (allWorkItems && allWorkItems.length > 0),
    [allCategories, allWorkItems, allProjectTemplates],
  );

  const hasVendorData: boolean = useMemo(() => allVendors && allVendors.length > 0, [allVendors]);
  const hasSupplierData: boolean = useMemo(() => allSuppliers && allSuppliers.length > 0, [allSuppliers]);

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
                const outputPath = `${FileSystem.documentDirectory}ProjectHoundConfig.json`;
                await FileSystem.writeAsStringAsync(outputPath, jsonText, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
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
                  const fileText = await FileSystem.readAsStringAsync(file.uri, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
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
                const outputPath = `${FileSystem.documentDirectory}vendors.csv`;
                await FileSystem.writeAsStringAsync(outputPath, csvData, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
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
                  const fileText = await FileSystem.readAsStringAsync(file.uri, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
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
      } else if (menuItem === 'ExportSuppliers') {
        Alert.alert('Export Suppliers', 'Would you like to export all suppliers to a CSV file?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const csvData = suppliersToCsv(allSuppliers);
                const outputPath = `${FileSystem.documentDirectory}suppliers.csv`;
                await FileSystem.writeAsStringAsync(outputPath, csvData, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(outputPath, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Share Suppliers CSV',
                    UTI: 'public.comma-separated-values-text',
                  });
                }
              } catch (err) {
                console.error('Error exporting suppliers:', err);
                Alert.alert('Error', 'Failed to export suppliers');
              }
            },
          },
        ]);
        return;
      } else if (menuItem === 'ImportSuppliers') {
        Alert.alert('Import Suppliers', 'Would you like to import suppliers from a CSV file?', [
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
                  const fileText = await FileSystem.readAsStringAsync(file.uri, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
                  const importedSuppliers = csvToSuppliers(fileText);

                  let addedCount = 0;
                  let updatedCount = 0;

                  for (const supplier of importedSuppliers) {
                    // Find existing supplier with matching name and address
                    // Ensure both name and address have meaningful values for matching
                    const existing = allSuppliers.find((s) => {
                      const nameMatch = s.name && supplier.name && s.name === supplier.name;
                      const addressMatch = s.address && supplier.address && s.address === supplier.address;
                      return nameMatch && addressMatch;
                    });

                    if (existing) {
                      // Update existing supplier
                      updateSupplier(existing.id, supplier);
                      updatedCount++;
                    } else {
                      // Add new supplier
                      addSupplierToStore(supplier as SupplierData);
                      addedCount++;
                    }
                  }

                  Alert.alert(
                    'Import Complete',
                    `Suppliers imported successfully.\nAdded: ${addedCount}\nUpdated: ${updatedCount}`,
                  );
                }
              } catch (error) {
                console.error('Error importing suppliers:', error);
                Alert.alert('Error', 'Failed to import suppliers');
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
      allSuppliers,
      addVendorToStore,
      updateVendor,
      addSupplierToStore,
      updateSupplier,
      cleanupOrphanedWorkItems,
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
      ...(hasVendorData
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
      {
        icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
        label: 'Import Vendors',
        onPress: (e: GestureResponderEvent, actionContext?: any) => {
          handleMenuItemPress('ImportVendors');
        },
      },
      ...(hasSupplierData
        ? [
            {
              icon: <MaterialCommunityIcons name="export" size={28} color={colors.iconColor} />,
              label: 'Export Suppliers',
              onPress: (e: GestureResponderEvent, actionContext?: any) => {
                handleMenuItemPress('ExportSuppliers');
              },
            },
          ]
        : []),
      {
        icon: <MaterialCommunityIcons name="import" size={28} color={colors.iconColor} />,
        label: 'Import Suppliers',
        onPress: (e: GestureResponderEvent, actionContext?: any) => {
          handleMenuItemPress('ImportSuppliers');
        },
      },
    ];
    return menuButtons;
  }, [colors, handleMenuItemPress, hasConfigurationData, hasVendorData, hasSupplierData]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
          ...headerRightComponent,
        }}
      />

      <View style={{ flex: 1, width: '100%', paddingHorizontal: 10, backgroundColor: colors.listBackground }}>
        <ConfigurationEntry
          label="Categories"
          description="Manage work categories"
          onPress={() => router.push('/configuration/workcategory/workCategories')}
        />
        <ConfigurationEntry
          label="Project Templates"
          description="Define Project-specific Work Items"
          onPress={() => router.push('/configuration/template/templates')}
        />
        <ConfigurationEntry
          label="Vendors/Merchants"
          description="Add and Edit Vendors/Merchants"
          onPress={() => router.push('/configuration/vendor/vendors')}
        />
        <ConfigurationEntry
          label="Suppliers/Contractors"
          description="Add and Edit Suppliers/Contractors"
          onPress={() => router.push('/configuration/supplier/suppliers')}
        />
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
