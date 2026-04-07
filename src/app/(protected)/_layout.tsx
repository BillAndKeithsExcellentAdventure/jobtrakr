import { Redirect, Stack } from 'expo-router';
import { useAuth, useOrganization } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';
import { registerForPushNotifications } from '@/src/utils/notificationServices';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { ActiveProjectIdsProvider } from '@/src/context/ActiveProjectIdsContext';
import { WorkItemSpentSummaryProvider } from '@/src/context/WorkItemSpentSummaryContext';
import { AuthorizedStoresProvider } from '@/src/components/AuthorizedStoresProvider';
import ActiveProjectDetailsStoreProvider from '@/src/components/ActiveProjectDetailsStoreProvider';
import { UploadQueueProcessor } from '@/src/components/UploadQueueProcessor';
import { ProjectCostSummaryUpdater } from '@/src/components/ProjectCostSummaryUpdater';
import {
  SUBSCRIPTION_REFRESH_INTERVAL_MS,
  useRefreshSubscription,
  useSubscriptionInformation,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { AppState } from 'react-native';

export const unstable_settings = {
  initialRouteName: '(home)', // anchor
};

const SubscriptionEntitlementsBootstrap = () => {
  const { orgId, userId } = useAuth();
  const refreshSubscription = useRefreshSubscription();
  const { lastChecked } = useSubscriptionInformation();
  const refreshSubscriptionRef = useRef(refreshSubscription);
  const lastStartupRefreshKeyRef = useRef<string | null>(null);

  useEffect(() => {
    refreshSubscriptionRef.current = refreshSubscription;
  }, [refreshSubscription]);

  useEffect(() => {
    if (!orgId || !userId) {
      return;
    }

    const refreshKey = `${orgId}:${userId}`;
    if (lastStartupRefreshKeyRef.current === refreshKey) {
      return;
    }

    lastStartupRefreshKeyRef.current = refreshKey;
    refreshSubscriptionRef.current().catch((error) => {
      console.error('Failed to refresh subscription on startup:', error);
    });
  }, [orgId, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      const isStale = Date.now() - lastChecked > SUBSCRIPTION_REFRESH_INTERVAL_MS;
      if (!isStale) {
        return;
      }

      refreshSubscriptionRef.current().catch((error) => {
        console.error('Failed to refresh subscription after foregrounding:', error);
      });
    });

    return () => {
      subscription.remove();
    };
  }, [lastChecked]);

  return null;
};

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { organization } = useOrganization();

  // Requires an expo build in order to implement push notifications
  useEffect(() => {
    const setupPushNotifications = async (): Promise<void> => {
      if (isSignedIn && userId && organization?.id) {
        try {
          await registerForPushNotifications(organization.id, userId, API_BASE_URL);
        } catch (error) {
          console.error('Failed to setup push notifications:', error);
        }
      }
    };

    setupPushNotifications();
  }, [isSignedIn, userId, organization?.id]);

  // Show loading state while auth is initializing
  if (!isLoaded) {
    return null;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <AuthorizedStoresProvider />
      <SubscriptionEntitlementsBootstrap />
      <UploadQueueProcessor />
      <ActiveProjectIdsProvider>
        <WorkItemSpentSummaryProvider>
          <ActiveProjectDetailsStoreProvider>
            <ProjectCostSummaryUpdater />
            <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerBackTitle: '' }}>
              <Stack.Screen
                name="(home)"
                options={{
                  headerShown: false,
                  animation: 'none',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                }}
              />
            </Stack>
          </ActiveProjectDetailsStoreProvider>
        </WorkItemSpentSummaryProvider>
      </ActiveProjectIdsProvider>
    </>
  );
}
