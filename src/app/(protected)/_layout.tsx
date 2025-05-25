import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Provider as TinyBaseProvider } from 'tinybase/ui-react';
import { ActiveProjectIdsProvider } from '@/src/context/ActiveProjectIdsContext';
import AuthorizedStoresProvider from '@/src/components/AuthorizedStoresProvider';

export const unstable_settings = {
  initialRouteName: '(home)', // anchor
};

export default function ProtectedLayout() {
  const { isSignedIn, orgId, isLoaded } = useAuth();

  console.log(`ProtectedLayout Clerk isLoaded=${isLoaded}`);
  console.log(`ProtectedLayout Clerk isSignedIn=${isSignedIn}`);
  console.log(`ProtectedLayout Clerk orgId=${orgId}`);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || !orgId) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <TinyBaseProvider>
      <ActiveProjectIdsProvider>
        <AuthorizedStoresProvider />
        <Stack>
          <Stack.Screen
            name="(home)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ActiveProjectIdsProvider>
    </TinyBaseProvider>
  );
}
