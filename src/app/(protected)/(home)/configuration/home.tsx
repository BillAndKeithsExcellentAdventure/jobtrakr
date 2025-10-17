import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native-gesture-handler';
import * as Sharing from 'expo-sharing';
import { Alert, GestureResponderEvent, Platform } from 'react-native';
import {
  exportStoreDataCallback,
  importJsonConfigurationDataCallback,
  useAllRows,
  WorkCategoryCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import * as DocumentPicker from 'expo-document-picker';

const home = () => {
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const router = useRouter();
  const colors = useColors();
  const appVersion = Constants?.expoConfig?.version ?? 'unknown';
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems');
  const allProjectTemplates = useAllRows('templates');

  const exportConfiguration = exportStoreDataCallback();
  const importConfiguration = importJsonConfigurationDataCallback();
  const hasConfigurationData: boolean = useMemo(
    () =>
      (allCategories && allCategories.length > 0) ||
      (allProjectTemplates && allProjectTemplates.length > 0) ||
      (allWorkItems && allWorkItems.length > 0),
    [allCategories, allWorkItems, allProjectTemplates],
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
      }
    },
    [exportConfiguration],
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
    ];
    return menuButtons;
  }, [colors, handleMenuItemPress, allCategories]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
          ...headerRightComponent,
        }}
      />

      <View style={{ alignItems: 'center', paddingTop: 10, backgroundColor: colors.listBackground }}>
        <Text txtSize="title" text="Project Hound" style={{ marginBottom: 5 }} />
        <Text
          txtSize="standard"
          text={`version ${appVersion}`}
          style={{ marginBottom: 10, backgroundColor: colors.listBackground }}
        />
      </View>
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
          label="Vendors"
          description="Add and Edit Vendors"
          onPress={() => router.push('/configuration/vendor/vendors')}
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

export default home;
