import React, { useState, useEffect, useCallback } from 'react';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useAutoSaveNavigation } from '@/src/hooks/useFocusManager';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import {
  useSetAppSettingsCallback,
  useAppSettings,
  SettingsData,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { Platform, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

async function createBase64LogoImage(
  uri: string,
  width: number | undefined,
  height = 200,
): Promise<string | undefined> {
  let thumbnailUrlInBase64: string | undefined = undefined;

  try {
    const manipulationContext = await ImageManipulator.ImageManipulator.manipulate(uri);
    await manipulationContext.resize({ width, height });
    const imageResult = await (await manipulationContext.renderAsync()).saveAsync({ base64: true });
    //console.log(`Creating thumbnail ...Base64 Length: ${imageResult.base64?.length}`);
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

  // Sync settings state when appSettings changes
  useEffect(() => {
    setSettings(appSettings);
  }, [appSettings]);

  const handleChange = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = useCallback(() => {
    setAppSettings(settings);
  }, [settings, setAppSettings]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
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
            value={String(settings.phone ?? '')}
            onChangeText={(text) => handleChange('phone', text)}
            onBlur={handleSave}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Email"
            placeholder="Email"
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
          </View>
        </View>
      </KeyboardAwareScrollView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
