import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActiveProjectIdsProvider } from '@/src/context/ActiveProjectIdsContext';
import { WorkItemSpentSummaryProvider } from '@/src/context/WorkItemSpentSummaryContext';
import AuthorizedStoresProvider from '@/src/components/AuthorizedStoresProvider';
import ActiveProjectDetailsStoreProvider from '@/src/components/ActiveProjectDetailsStoreProvider';
import UploadQueueProcessor from '@/src/components/UploadQueueProcessor';

export const unstable_settings = {
  initialRouteName: '(home)', // anchor
};

export default function ProtectedLayout() {
  const { isSignedIn, orgId, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || !orgId) {
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
