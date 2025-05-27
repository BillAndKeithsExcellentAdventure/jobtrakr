import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActiveProjectIdsProvider } from '@/src/context/ActiveProjectIdsContext';
import AuthorizedStoresProvider from '@/src/components/AuthorizedStoresProvider';
import ActiveProjectDetailsStoreProvider from '@/src/components/ActiveProjectDetailsStoreProvider';

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
      <ActiveProjectIdsProvider>
        <ActiveProjectDetailsStoreProvider>
          <Stack>
            <Stack.Screen
              name="(home)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </ActiveProjectDetailsStoreProvider>
      </ActiveProjectIdsProvider>
    </>
  );
}
