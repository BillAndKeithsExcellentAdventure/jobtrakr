import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { DOCS_URL } from '@/src/constants/app-constants';
import { getSelectSubscriptionHTML } from '@/src/utils/subscriptionApi';

export default function SubscriptionOverviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { orgId, userId } = useAuth();

  const handleOpenDocs = useCallback(async () => {
    await WebBrowser.openBrowserAsync(`${DOCS_URL}/home/subscriptions`);
  }, []);

  const handleSubscribePress = useCallback(async () => {
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

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Subscription Overview',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]}
      >
        <Text txtSize="title" style={styles.headerTitle}>
          Subscription Options
        </Text>

        <View
          style={[
            styles.tierCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text txtSize="sub-title" style={styles.tierTitle}>
            Free Tier
          </Text>
          <Text>
            This tier does not require a subscription but is limited to working with a single project. This
            tier is only for demonstrating the capabilities of the application.
          </Text>
        </View>

        <View
          style={[
            styles.tierCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text txtSize="sub-title" style={styles.tierTitle}>
            Basic Tier
          </Text>
          <Text>
            This tier requires a subscription plan. It offers a balanced set of features suitable for users
            that do not require connecting to QuickBooks.
          </Text>
        </View>

        <View
          style={[
            styles.tierCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text txtSize="sub-title" style={styles.tierTitle}>
            Premium Tier
          </Text>
          <Text>
            This tier requires a subscription plan. It offers the most comprehensive set of features,
            including unlimited projects, suitable for users that require advanced capabilities and
            integration with QuickBooks.
          </Text>
        </View>
        <Text style={[styles.detailsLink, { color: colors.buttonBlue }]} onPress={handleOpenDocs}>
          Get more subscription details
        </Text>

        <ActionButton
          title="Subscribe"
          type="action"
          onPress={handleSubscribePress}
          style={styles.subscribeButton}
        />
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
  headerCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  detailsLink: {
    textDecorationLine: 'underline',
    marginTop: -2,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  tierTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  subscribeButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
