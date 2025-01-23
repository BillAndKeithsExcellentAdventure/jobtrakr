import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SessionProvider, useSession } from '@/session/ctx';
import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const InitialLayout = () => {
  const { session } = useSession();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    const inTabsGroup = segments[0] === '(auth)';

    console.log('User changed: ', session);

    if (session && !inTabsGroup) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/auth');
    }
  }, [session]);

  if (!session) return <Redirect href='/(auth)/auth' />;

  return <Redirect href='/(tabs)/home' />;
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <InitialLayout />
      </SessionProvider>
    </ThemeProvider>
  );
}
