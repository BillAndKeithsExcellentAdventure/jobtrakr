import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useSetAppSettingsCallback } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { getEULAHTML } from '@/src/utils/subscriptionApi';

export default function EulaRequiredScreen() {
  const colors = useColors();
  const router = useRouter();
  const setAppSettings = useSetAppSettingsCallback();
  const [isLoadingEula, setIsLoadingEula] = useState(false);

  const handleViewEula = useCallback(async () => {
    const loadingTimer = setTimeout(() => setIsLoadingEula(true), 500);
    try {
      const eulaHtml = await getEULAHTML();
      if (!eulaHtml.trim()) {
        throw new Error('EULA content is empty.');
      }

      router.push({
        pathname: '/eula/view',
        params: { html: eulaHtml },
      } as never);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not load the EULA. Please try again.';
      Alert.alert('Unable to Load EULA', message);
    } finally {
      clearTimeout(loadingTimer);
      setIsLoadingEula(false);
    }
  }, [router]);

  const handleAccept = useCallback(() => {
    const result = setAppSettings({ acceptedEULA: true });
    if (result.status === 'Success') {
      router.replace('/');
      return;
    }

    Alert.alert('Error', result.msg || 'We could not save your acceptance. Please try again.');
  }, [router, setAppSettings]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'End User License Agreement',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]}
      >
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text txtSize="sub-title" style={styles.message}>
            To continue, you must review and accept the End User License Agreement (EULA).
          </Text>
        </View>

        <ActionButton title="Review EULA" type="action" onPress={handleViewEula} style={styles.button} />

        {isLoadingEula && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.buttonBlue} />
            <Text style={styles.loadingText}>Loading EULA</Text>
          </View>
        )}

        <ActionButton title="I Accept" type="action" onPress={handleAccept} style={styles.button} />
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text txtSize="sub-title" style={styles.message}>
            If you do not accept, please close the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  message: {
    lineHeight: 24,
  },
  button: {
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
});
