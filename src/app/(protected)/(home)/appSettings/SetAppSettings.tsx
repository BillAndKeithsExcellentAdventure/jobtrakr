import React, { useState, useEffect } from 'react';
import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  setAppSettingsCallback,
  useAppSettings,
  SettingsData,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { Platform, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

const SetAppSettingScreen = () => {
  const colors = useColors();
  const router = useRouter();

  const appSettings = useAppSettings();
  const setAppSettings = setAppSettingsCallback();
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

  const handleSave = () => {
    setAppSettings(settings);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Company Settings',
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={[{ backgroundColor: colors.modalOverlayBackgroundColor, flex: 1, marginBottom: 62 }]}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Company Name</Text>
            <TextInput
              value={String(settings.companyName ?? '')}
              onChangeText={(text) => handleChange('companyName', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Address</Text>
            <TextInput
              value={String(settings.address ?? '')}
              onChangeText={(text) => handleChange('address', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              multiline={true}
              numberOfLines={2}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>City</Text>
            <TextInput
              value={String(settings.city ?? '')}
              onChangeText={(text) => handleChange('city', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.listBackground, gap: 8 }}>
            <View style={{ marginBottom: 4, backgroundColor: colors.listBackground, flex: 1 }}>
              <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>State</Text>
              <TextInput
                value={String(settings.state ?? '')}
                onChangeText={(text) => handleChange('state', text)}
                style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={{ marginBottom: 4, width: 120, backgroundColor: colors.listBackground }}>
              <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Zip</Text>
              <TextInput
                value={String(settings.zip ?? '')}
                onChangeText={(text) => handleChange('zip', text)}
                style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Owner/Contact</Text>
            <TextInput
              value={String(settings.ownerName ?? '')}
              onChangeText={(text) => handleChange('ownerName', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Phone</Text>
            <TextInput
              value={String(settings.phone ?? '')}
              onChangeText={(text) => handleChange('phone', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>
            <Text style={{ marginBottom: 4, backgroundColor: colors.listBackground }}>Email</Text>
            <TextInput
              value={String(settings.email ?? '')}
              onChangeText={(text) => handleChange('email', text)}
              style={{ borderWidth: 1, padding: 4, backgroundColor: colors.background }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.saveButtonRow}>
            <ActionButton style={styles.saveButton} onPress={handleSave} type="ok" title="Save" />
            <ActionButton
              style={styles.cancelButton}
              onPress={() => {
                router.back();
              }}
              type={'cancel'}
              title="Cancel"
            />
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
  modalContainer: {
    maxWidth: 460,
    width: '100%',
  },
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default SetAppSettingScreen;
