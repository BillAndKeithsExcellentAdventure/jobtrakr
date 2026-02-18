import React, { useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/src/components/Themed';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { ReactNativeLegal } from 'react-native-legal';
import { DOCS_URL } from '@/src/constants/app-constants';
import { Image } from 'expo-image';

export default function AboutScreen() {
  const colors = useColors();

  const appName = 'ProjectHound';
  const appVersion = Application.nativeApplicationVersion || '1.0.4';

  const handleOpenDocs = useCallback(async () => {
    await WebBrowser.openBrowserAsync(`${DOCS_URL}/home`);
  }, []);

  const handleOpenLicenses = useCallback(() => {
    ReactNativeLegal.launchLicenseListScreen('Open Source Software Licenses');
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'About',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
      >
        <View style={styles.appInfoContainer}>
          <Image source={require('@/assets/images/icon.png')} style={styles.appIcon} contentFit="contain" />
          <Text txtSize="xl" style={styles.appName}>
            {appName}
          </Text>
          <Text txtSize="sub-title" style={styles.version}>
            Version {appVersion}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <ActionButton
            title="Open Help Documentation"
            type="action"
            onPress={handleOpenDocs}
            style={styles.button}
          />
          <ActionButton
            title="View OSS Licenses"
            type="action"
            onPress={handleOpenLicenses}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  appInfoContainer: {
    alignItems: 'center',
    marginVertical: 40,
    backgroundColor: 'transparent',
  },
  appIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  version: {
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
  },
  button: {
    marginBottom: 15,
  },
});
