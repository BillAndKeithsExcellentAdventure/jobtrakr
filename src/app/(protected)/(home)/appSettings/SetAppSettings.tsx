import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { useAutoSaveNavigation } from '@/src/hooks/useFocusManager';
import {
  SettingsData,
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { isDevelopmentBuild } from '@/src/utils/environment';
import {
  isQuickBooksConnected,
  connectToQuickBooks as qbConnect,
  disconnectQuickBooks as qbDisconnect,
} from '@/src/utils/quickbooksAPI';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { useAuth } from '@clerk/clerk-expo';

async function createBase64LogoImage(
  uri: string,
  width: number | undefined,
  height = 200,
): Promise<string | undefined> {
  let thumbnailUrlInBase64: string | undefined = undefined;

  try {
    const manipulationContext = ImageManipulator.ImageManipulator.manipulate(uri);
    manipulationContext.resize({ width, height });
    const imageResult = await (await manipulationContext.renderAsync()).saveAsync({ base64: true });
    thumbnailUrlInBase64 = imageResult.base64;
  } catch (error) {
    console.error(`Error creating thumbnail: ${error}`);
    thumbnailUrlInBase64 = undefined;
  }
  return thumbnailUrlInBase64;
}

const SetAppSettingScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const auth = useAuth();
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();
  const [settings, setSettings] = useState<SettingsData>(appSettings);
  const [isQBConnected, setIsQBConnected] = useState<boolean>(false);
  const [isCheckingQBConnection, setIsCheckingQBConnection] = useState<boolean>(true);

  // Check if we're in a development build
  const isDevelopment = isDevelopmentBuild();

  // Sync settings state when appSettings changes
  useEffect(() => {
    setSettings(appSettings);
  }, [appSettings]);

  // Check QuickBooks connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!auth.orgId || !auth.userId) {
        console.warn('Org ID or User ID not available for QB connection check');
        setIsCheckingQBConnection(false);
        return;
      }

      try {
        const token = await auth.getToken();
        if (!token) {
          console.warn('No auth token available');
          setIsQBConnected(false);
          setIsCheckingQBConnection(false);
          return;
        }

        const connected = await isQuickBooksConnected(auth.orgId, auth.userId, auth.getToken);
        setIsQBConnected(connected);
      } catch (error) {
        console.error('Error checking QuickBooks connection:', error);
        // Don't mark as error, just show as disconnected
        setIsQBConnected(false);
      } finally {
        setIsCheckingQBConnection(false);
      }
    };

    checkConnection();
  }, [auth.orgId, auth.userId, auth.getToken]);

  const handleChange = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDebugOfflineToggle = useCallback(
    (value: boolean) => {
      const updatedSettings = { ...settings, debugForceOffline: value };
      setSettings(updatedSettings);
      setAppSettings(updatedSettings);
    },
    [settings, setAppSettings],
  );

  const handleSave = useCallback(() => {
    setAppSettings(settings);
  }, [settings, setAppSettings]);

  const handleConnectToQuickBooks = useCallback(async () => {
    if (!auth.orgId || !auth.userId) {
      Alert.alert('Error', 'Authentication required to connect to QuickBooks');
      return;
    }

    try {
      const token = await auth.getToken();
      if (!token) {
        Alert.alert('Error', 'Unable to obtain authentication token');
        return;
      }

      const { authUrl } = await qbConnect(auth.orgId, auth.userId, auth.getToken);
      if (authUrl) {
        const result = await WebBrowser.openBrowserAsync(authUrl);
        // If browser was opened successfully, check connection status again
        if (result.type === 'cancel' || result.type === 'dismiss') {
          // User closed browser, check if they completed authentication
          setTimeout(async () => {
            try {
              const connected = await isQuickBooksConnected(auth.orgId!, auth.userId!, auth.getToken);
              setIsQBConnected(connected);
              if (connected) {
                Alert.alert('Success', 'Successfully connected to QuickBooks!');
              }
            } catch (error) {
              console.error('Error checking connection after browser close:', error);
            }
          }, 1000);
        }
      } else {
        Alert.alert('Error', 'No authorization URL received from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      //console.error('Error connecting to QuickBooks:', errorMessage);
      Alert.alert('Error', `Failed to connect to QuickBooks: ${errorMessage}`);
    }
  }, [auth]);

  const handleDisconnectFromQuickBooks = useCallback(async () => {
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
          try {
            const token = await auth.getToken();
            if (!token) {
              Alert.alert('Error', 'Unable to obtain authentication token');
              return;
            }

            await qbDisconnect(auth.orgId!, auth.userId!, auth.getToken);
            setIsQBConnected(false);
            Alert.alert('Success', 'Successfully disconnected from QuickBooks');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            //console.error('Error disconnecting from QuickBooks:', errorMessage);
            Alert.alert('Error', `Failed to disconnect from QuickBooks: ${errorMessage}`);
          }
        },
      },
    ]);
  }, [auth]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const base64Image = await createBase64LogoImage(asset.uri, undefined, 200);

      const dataUrl = base64Image ? `data:image/png;base64,${base64Image}` : '';
      // Update local state and save to store immediately
      const updatedSettings = { ...settings, companyLogo: dataUrl };
      setSettings(updatedSettings);
      setAppSettings(updatedSettings);
    }
  };

  const handleBackPress = useAutoSaveNavigation(() => {
    handleSave();
    router.back();
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Company Settings',
          gestureEnabled: false,
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={[{ backgroundColor: colors.modalOverlayBackgroundColor, flex: 1 }]}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <TextField
            label="Company Name"
            placeholder="Company Name"
            value={String(settings.companyName ?? '')}
            onChangeText={(text) => handleChange('companyName', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Address"
            placeholder="Address"
            value={String(settings.address ?? '')}
            onChangeText={(text) => handleChange('address', text)}
            onBlur={handleSave}
            multiline={true}
            numberOfLines={2}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="City"
            placeholder="City"
            value={String(settings.city ?? '')}
            onChangeText={(text) => handleChange('city', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', backgroundColor: colors.listBackground, gap: 8 }}>
            <View style={{ marginBottom: 4, backgroundColor: colors.listBackground, flex: 1 }}>
              <TextField
                label="State"
                placeholder="State"
                value={String(settings.state ?? '')}
                onChangeText={(text) => handleChange('state', text)}
                onBlur={handleSave}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={{ marginBottom: 4, width: 120, backgroundColor: colors.listBackground }}>
              <TextField
                label="Zip"
                placeholder="Zip"
                keyboardType="numeric"
                value={String(settings.zip ?? '')}
                onChangeText={(text) => handleChange('zip', text)}
                onBlur={handleSave}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <TextField
            label="Owner/Contact"
            placeholder="Owner/Contact"
            value={String(settings.ownerName ?? '')}
            onChangeText={(text) => handleChange('ownerName', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Phone"
            placeholder="Phone"
            keyboardType="phone-pad"
            value={String(settings.phone ?? '')}
            onChangeText={(text) => handleChange('phone', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Email"
            placeholder="Email"
            keyboardType="email-address"
            value={String(settings.email ?? '')}
            onChangeText={(text) => handleChange('email', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', marginBottom: 4, backgroundColor: colors.listBackground }}>
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onPress={pickImage}
            >
              <Text>Select</Text>
              <Text>Company</Text>
              <Text>Logo</Text>
            </TouchableOpacity>
            {settings.companyLogo && (
              <Image
                source={{ uri: settings.companyLogo }}
                style={{ width: 80, height: 80, resizeMode: 'contain' }}
              />
            )}

            {!isCheckingQBConnection && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: isQBConnected ? '#dc3545' : colors.tint,
                  },
                ]}
                onPress={isQBConnected ? handleDisconnectFromQuickBooks : handleConnectToQuickBooks}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {isQBConnected ? 'Disconnect from QuickBooks' : 'Connect to QuickBooks'}
                </Text>
              </TouchableOpacity>
            )}
            {isCheckingQBConnection && (
              <View
                style={[
                  styles.button,
                  { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <Text>Checking...</Text>
              </View>
            )}
          </View>
          {isDevelopment && (
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 8,
                marginTop: 8,
                backgroundColor: colors.listBackground,
                alignItems: 'center',
              }}
            >
              <Switch
                value={settings.debugForceOffline}
                onValueChange={handleDebugOfflineToggle}
                size="large"
              />
              <Text txtSize="standard" style={{ marginLeft: 10 }}>
                Debug: Force Offline Mode
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 16,
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
  },
});

export default SetAppSettingScreen;
