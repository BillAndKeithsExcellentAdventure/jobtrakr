import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import { ENTITLEMENT } from '@/src/models/types';
import {
  useEffectiveSubscriptionTier,
  useEntitlementsPayload,
  useEntitlementsSource,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

export default function AboutScreen() {
  const colors = useColors();
  const effectiveSubscriptionTier = useEffectiveSubscriptionTier();
  const entitlements = useEntitlementsPayload();
  const entitlementsSource = useEntitlementsSource();
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const appName = 'ProjectHound';
  const appVersion = Application.nativeApplicationVersion || '1.0.4';

  const entitlementRows = useMemo(
    () =>
      ENTITLEMENT.map((entitlement) => ({
        key: entitlement,
        value: entitlements ? entitlements[entitlement] : null,
      })),
    [entitlements],
  );

  const handleOpenDocs = useCallback(async () => {
    await WebBrowser.openBrowserAsync(`${DOCS_URL}/home`);
  }, []);

  const handleOpenLicenses = useCallback(() => {
    ReactNativeLegal.launchLicenseListScreen('Open Source Software Licenses');
  }, []);

  const formatEntitlementValue = useCallback((value: boolean | number | null) => {
    if (value === null) {
      return 'Not loaded';
    }

    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }

    if (value < 0) {
      return 'Unlimited';
    }

    return String(value);
  }, []);

  const formatEntitlementsSource = useCallback((source: string) => {
    if (source === 'override') return 'Developer Override';
    if (source === 'fallback') return 'Fallback (cached/free default)';
    return 'Server';
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
          <View
            style={[
              styles.subscriptionCard,
              { borderColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <Text txtSize="sub-title" style={styles.subscriptionTitle}>
              Current Subscription
            </Text>
            <Text txtSize="title" style={styles.subscriptionTierText}>
              {effectiveSubscriptionTier.charAt(0).toUpperCase() + effectiveSubscriptionTier.slice(1)}
            </Text>
            <Text style={styles.subscriptionSourceText}>
              Source: {formatEntitlementsSource(entitlementsSource)}
            </Text>
            <ActionButton
              title="Show Details"
              type="action"
              onPress={() => setIsDetailsVisible(true)}
              style={styles.subscriptionButton}
            />
          </View>
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
      <Modal
        transparent
        animationType="slide"
        visible={isDetailsVisible}
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTopRow}>
                <Text txtSize="title">Subscription Details</Text>
                <Pressable onPress={() => setIsDetailsVisible(false)}>
                  <Text txtSize="sub-title" style={{ color: colors.buttonBlue }}>
                    Close
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.modalSourceText}>
                Source: {formatEntitlementsSource(entitlementsSource)}
              </Text>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              {entitlementRows.map((entitlementRow) => (
                <View
                  key={entitlementRow.key}
                  style={[styles.entitlementRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={styles.entitlementLabel}>{entitlementRow.key}</Text>
                  <Text style={styles.entitlementValue}>{formatEntitlementValue(entitlementRow.value)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  subscriptionCard: {
    width: '100%',
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  subscriptionTitle: {
    marginBottom: 8,
  },
  subscriptionTierText: {
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  subscriptionSourceText: {
    opacity: 0.75,
    marginBottom: 12,
  },
  subscriptionButton: {
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  modalHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalScroll: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalSourceText: {
    opacity: 0.75,
    marginTop: 2,
  },
  entitlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    backgroundColor: 'transparent',
  },
  entitlementLabel: {
    flex: 1,
  },
  entitlementValue: {
    fontWeight: '600',
  },
});
