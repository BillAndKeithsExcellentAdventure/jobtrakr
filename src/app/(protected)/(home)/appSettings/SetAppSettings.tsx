import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { isEmailVerified, sendVerificationEmail } from '@/src/utils/quickbooksAPI';
import {
  SettingsData,
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { isDevelopmentBuild } from '@/src/utils/environment';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { useAuth } from '@clerk/clerk-expo';
import { useNetwork } from '@/src/context/NetworkContext';

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
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();
  const [settings, setSettings] = useState<SettingsData>(appSettings);
  const [emailHasBeenVerified, setEmailHasBeenVerified] = useState(true); // Assume true initially to avoid showing the verify button unnecessarily while we check the actual status
  const { userId, orgId, getToken } = useAuth();
  const { isConnected } = useNetwork();
  // Check if we're in a development build
  const isDevelopment = isDevelopmentBuild();

  // Sync settings state when appSettings changes
  useEffect(() => {
    setSettings(appSettings);
  }, [appSettings]);

  useEffect(() => {
    // Check if the user's email is verified
    const checkEmailVerification = async () => {
      // Simulate an API call or logic to check email verification status
      // Replace this with your actual implementation
      const emailVerified = await isEmailVerified(orgId!, userId!, appSettings.email, getToken);
      setEmailHasBeenVerified(emailVerified);
    };

    if (appSettings.email && orgId && userId && isConnected) {
      checkEmailVerification();
    }
  }, [appSettings.email, orgId, userId, getToken, isConnected]);

  const handleChange = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDebugOfflineToggle = useCallback(
    (value: boolean) => {
      const updatedSettings = { ...settings, debugForceOffline: value };
      setAppSettings(updatedSettings);
      setSettings(updatedSettings);
    },
    [settings, setAppSettings],
  );

  const handleSave = useCallback(() => {
    setAppSettings(settings);
  }, [settings, setAppSettings]);

  // Check which settings are complete
  const areAllSettingsMet = useMemo((): boolean => {
    return (
      settings.companyName.trim().length > 0 &&
      settings.ownerName.trim().length > 0 &&
      settings.address.trim().length > 0 &&
      settings.city.trim().length > 0 &&
      settings.state.trim().length > 0 &&
      settings.zip.trim().length > 0 &&
      settings.email.trim().length > 0 &&
      settings.phone.trim().length > 0
    );
  }, [settings]);

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
      setAppSettings(updatedSettings);
      setSettings(updatedSettings);
    }
  };

  const handleBackPress = useCallback(() => {
    // Check if minimum app settings are met
    const allSettingsMet =
      settings.companyName.trim().length > 0 &&
      settings.ownerName.trim().length > 0 &&
      settings.address.trim().length > 0 &&
      settings.city.trim().length > 0 &&
      settings.state.trim().length > 0 &&
      settings.zip.trim().length > 0 &&
      settings.email.trim().length > 0 &&
      settings.phone.trim().length > 0;

    if (!allSettingsMet) {
      Alert.alert('Incomplete Setup', 'Please complete all required fields before continuing.', [
        { text: 'OK', style: 'default' },
      ]);
      return;
    }

    handleSave();
    const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
    if (!canGoBack) {
      console.log('SetAppSettings: no back stack, replacing to home');
      router.replace('/(protected)/(home)');
      return;
    }

    router.back();
  }, [settings, handleSave, router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Company Settings',
          gestureEnabled: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={[{ backgroundColor: colors.modalOverlayBackgroundColor, flex: 1 }]}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.container]}>
          {!areAllSettingsMet && (
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                marginBottom: 12,
                color: areAllSettingsMet ? colors.profitFg : colors.lossFg,
              }}
              text="⚠ Complete all required fields with *"
            />
          )}
          <TextField
            label="Company Name*"
            placeholder="Company Name"
            value={String(settings.companyName ?? '')}
            onChangeText={(text) => handleChange('companyName', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Address*"
            placeholder="Address"
            value={String(settings.address ?? '')}
            onChangeText={(text) => handleChange('address', text)}
            onBlur={handleSave}
            autoCorrect={false}
          />
          <TextField
            label="Address Line2 (optional)"
            placeholder="Address Line2"
            value={String(settings.address2 ?? '')}
            onChangeText={(text) => handleChange('address2', text)}
            onBlur={handleSave}
            autoCorrect={false}
          />

          <TextField
            label="City*"
            placeholder="City"
            value={String(settings.city ?? '')}
            onChangeText={(text) => handleChange('city', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ marginBottom: 4, flex: 1 }}>
              <TextField
                label="State*"
                placeholder="State"
                value={String(settings.state ?? '')}
                onChangeText={(text) => handleChange('state', text)}
                onBlur={handleSave}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={{ marginBottom: 4, width: 150 }}>
              <TextField
                label="Zip*"
                placeholder="Zip"
                keyboardType="number-pad"
                value={String(settings.zip ?? '')}
                onChangeText={(text) => handleChange('zip', text)}
                onBlur={handleSave}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <TextField
            label="Owner/Contact*"
            placeholder="Owner/Contact"
            value={String(settings.ownerName ?? '')}
            onChangeText={(text) => handleChange('ownerName', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Phone*"
            placeholder="Phone"
            keyboardType="phone-pad"
            value={String(settings.phone ?? '')}
            onChangeText={(text) => handleChange('phone', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <TextField
              containerStyle={{ flex: 1 }}
              label="Email*"
              placeholder="Email"
              keyboardType="email-address"
              value={String(settings.email ?? '')}
              onChangeText={(text) => handleChange('email', text)}
              onBlur={handleSave}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!emailHasBeenVerified && settings.email.trim().length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await sendVerificationEmail(orgId!, userId!, settings.email, getToken);
                    Alert.alert(
                      'Verification Email Sent',
                      'A verification email has been sent to your email address. Please check your inbox and click the verification link.',
                    );
                  } catch (error) {
                    console.error('Error sending verification email:', error);
                    Alert.alert(
                      'Error',
                      'There was an error sending the verification email. Please try again later.',
                    );
                  }
                }}
                style={{
                  backgroundColor: colors.buttonBlue,
                  borderRadius: 4,
                  alignSelf: 'flex-end',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: '#fff' }} text="Verify" />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4, gap: 10 }}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBlue }]}
              onPress={pickImage}
            >
              <Text style={{ color: '#fff' }}>Select</Text>
              <Text style={{ color: '#fff' }}>Company</Text>
              <Text style={{ color: '#fff' }}>Logo</Text>
            </TouchableOpacity>
            {settings.companyLogo && (
              <Image
                source={{ uri: settings.companyLogo }}
                style={{ width: 80, height: 80, resizeMode: 'contain' }}
              />
            )}
          </View>
          {isDevelopment && (
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 8,
                marginTop: 8,
                alignItems: 'center',
                justifyContent: 'center',
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
    padding: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
});

export default SetAppSettingScreen;
