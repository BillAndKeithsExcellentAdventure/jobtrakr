import { Redirect, Stack } from 'expo-router';
import { useAuth, useOrganization } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { registerForPushNotifications } from '@/src/utils/notificationServices';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { ActiveProjectIdsProvider } from '@/src/context/ActiveProjectIdsContext';
import { WorkItemSpentSummaryProvider } from '@/src/context/WorkItemSpentSummaryContext';
import { AuthorizedStoresProvider } from '@/src/components/AuthorizedStoresProvider';
import ActiveProjectDetailsStoreProvider from '@/src/components/ActiveProjectDetailsStoreProvider';
import { UploadQueueProcessor } from '@/src/components/UploadQueueProcessor';

export const unstable_settings = {
  initialRouteName: '(home)', // anchor
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
      <UploadQueueProcessor />
      <ActiveProjectIdsProvider>
        <WorkItemSpentSummaryProvider>
          <ActiveProjectDetailsStoreProvider>
            <Stack>
              <Stack.Screen
                name="(home)"
                options={{
                  headerShown: false,
                  animation: 'none',
                }}
              />
            </Stack>
          </ActiveProjectDetailsStoreProvider>
        </WorkItemSpentSummaryProvider>
      </ActiveProjectIdsProvider>
    </>
  );
}
