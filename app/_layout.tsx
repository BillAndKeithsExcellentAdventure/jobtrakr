import AuthorizedStoresProvider from '@/components/AuthorizedStoresProvider';
import { useColorScheme } from '@/components/useColorScheme';
import { ActiveProjectIdsProvider } from '@/context/ActiveProjectIdsContext';
import { ColorsProvider } from '@/context/ColorsContext';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { colors } from 'react-native-keyboard-controller/lib/typescript/components/KeyboardToolbar/colors';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as TinyBaseProvider } from 'tinybase/ui-react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Import your Publishable Key
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

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

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <TinyBaseProvider>
            <KeyboardProvider>
              <ActiveProjectIdsProvider>
                <AuthorizedStoresProvider />
                <ColorsProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="projects" />
                        <Stack.Screen name="(auth)" />
                      </Stack>
                      <StatusBar
                        style={colorScheme === 'dark' ? 'light' : 'dark'}
                        backgroundColor="transparent"
                      />
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </ColorsProvider>
              </ActiveProjectIdsProvider>
            </KeyboardProvider>
          </TinyBaseProvider>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
