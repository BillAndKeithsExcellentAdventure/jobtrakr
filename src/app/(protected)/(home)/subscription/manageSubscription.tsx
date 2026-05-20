import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useEffectiveSubscriptionTier,
  useRefreshSubscription,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  cancelSubscription,
  getSelectSubscriptionHTML,
  updateCard,
  upgradeSubscription,
} from '@/src/utils/subscriptionApi';

export default function ManageSubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { orgId, userId, getToken } = useAuth();
  const currentTier = useEffectiveSubscriptionTier();
  const refreshSubscription = useRefreshSubscription();

  const handleChooseSubscription = useCallback(async () => {
    if (!orgId || !userId) {
      Alert.alert('Authentication Required', 'Please sign in again before managing subscriptions.');
      return;
    }

    try {
      const subscriptionHtml = await getSelectSubscriptionHTML(orgId, userId);
      if (!subscriptionHtml || !subscriptionHtml.trim()) {
        throw new Error('Subscription page content is empty.');
      }

      router.push({
        pathname: '/subscription/choosePlan',
        params: { html: subscriptionHtml },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open subscription plans right now.';
      Alert.alert('Subscription Unavailable', message);
    }
  }, [orgId, userId, router]);

  const handleUpgradeToPremium = useCallback(async () => {
    if (!orgId || !userId) {
      Alert.alert('Authentication Required', 'Please sign in again before managing subscriptions.');
      return;
    }

    try {
      await upgradeSubscription(orgId, userId, 'premium', getToken);
      await refreshSubscription();
      Alert.alert('Subscription Upgraded', 'Your subscription has been successfully upgraded to Premium.');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upgrade subscription right now.';
      Alert.alert('Upgrade Failed', message);
    }
  }, [orgId, userId, getToken, refreshSubscription, router]);

  const handleDowngradeToBasic = useCallback(async () => {
    Alert.alert(
      'Downgrade Subscription',
      'Are you sure you want to downgrade from Premium to Basic? Some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Downgrade',
          style: 'destructive',
          onPress: async () => {
            if (!orgId || !userId) {
              Alert.alert('Authentication Required', 'Please sign in again before managing subscriptions.');
              return;
            }

            try {
              await upgradeSubscription(orgId, userId, 'basic', getToken);
              await refreshSubscription();
              Alert.alert(
                'Subscription Downgraded',
                'Your subscription has been successfully downgraded to Basic.',
              );
              router.back();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unable to downgrade subscription right now.';
              Alert.alert('Downgrade Failed', message);
            }
          },
        },
      ],
    );
  }, [orgId, userId, getToken, refreshSubscription, router]);

  const handleUpdateCreditCard = useCallback(async () => {
    if (!orgId || !userId) {
      Alert.alert('Authentication Required', 'Please sign in again before managing subscriptions.');
      return;
    }

    try {
      const { checkoutUrl } = await updateCard(orgId, userId, getToken);
      router.push({
        pathname: '/subscription/choosePlan',
        params: { url: checkoutUrl },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open card update right now.';
      Alert.alert('Card Update Unavailable', message);
    }
  }, [orgId, userId, getToken, router]);

  const handleCancelSubscription = useCallback(() => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription and downgrade to the free plan?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!orgId || !userId) {
              Alert.alert('Authentication Required', 'Please sign in again before managing subscriptions.');
              return;
            }

            try {
              await cancelSubscription(orgId, userId, getToken);
              await refreshSubscription();
              Alert.alert(
                'Subscription Cancelled',
                'Your subscription has been cancelled and your plan has been downgraded to free.',
              );
              router.back();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unable to cancel subscription right now.';
              Alert.alert('Cancellation Failed', message);
            }
          },
        },
      ],
    );
  }, [orgId, userId, getToken, refreshSubscription, router]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Subscription',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.currentTierCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text txtSize="sub-title" style={styles.currentTierLabel}>
            Current Subscription
          </Text>
          <Text txtSize="title" style={styles.currentTierText}>
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
          </Text>
        </View>

        {currentTier === 'free' && (
          <ActionButton
            title="Choose Subscription Plan"
            type="action"
            onPress={handleChooseSubscription}
            style={styles.button}
          />
        )}

        {currentTier === 'basic' && (
          <>
            <ActionButton
              title="Upgrade to Premium"
              type="action"
              onPress={handleUpgradeToPremium}
              style={styles.button}
            />
            <ActionButton
              title="Update Credit Card"
              type="action"
              onPress={handleUpdateCreditCard}
              style={styles.button}
            />
            <ActionButton
              title="Cancel Subscription"
              type="action"
              onPress={handleCancelSubscription}
              style={styles.cancelButton}
            />
          </>
        )}

        {currentTier === 'premium' && (
          <>
            <ActionButton
              title="Convert to Basic"
              type="action"
              onPress={handleDowngradeToBasic}
              style={styles.button}
            />
            <ActionButton
              title="Update Credit Card"
              type="action"
              onPress={handleUpdateCreditCard}
              style={styles.button}
            />
            <ActionButton
              title="Cancel Subscription"
              type="action"
              onPress={handleCancelSubscription}
              style={styles.cancelButton}
            />
          </>
        )}
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
    width: '100%',
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  currentTierCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  currentTierLabel: {
    marginBottom: 8,
  },
  currentTierText: {
    fontWeight: '700',
  },
  button: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 16,
  },
});
