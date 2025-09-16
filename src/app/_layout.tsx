import { useColorScheme } from '@/src/components/useColorScheme';
import { ColorsProvider } from '@/src/context/ColorsContext';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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
const CLERK_PUBLISHABLE_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.EXPO_PUBLIC_CLERK_PRODUCTION_PUBLISHABLE_KEY
    : process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  Alert.alert('Error', `'CLERK_PUBLISHABLE_KEY' is not set. Env is set to ${process.env.NODE_ENV}`, [
    {
      text: 'Close App',
      onPress: () => {
        throw new Error('Add your Clerk Publishable Key to the .env file');
      },
    },
  ]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
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
    Alert.alert('Warning', 'Waiting on fonts to load', [
      {
        text: 'OK',
        onPress: () => {
          return null;
        },
      },
    ]);
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY}>
      <StatusBar style="auto" />
      <TinyBaseProvider>
        <ClerkLoaded>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <KeyboardProvider>
              <ColorsProvider>
                <SafeAreaProvider>
                  <GestureHandlerRootView>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen
                        name="(auth)"
                        options={{
                          animation: 'none',
                        }}
                      />
                      <Stack.Screen
                        name="(protected)"
                        options={{
                          animation: 'none',
                        }}
                      />
                    </Stack>
                  </GestureHandlerRootView>
                </SafeAreaProvider>
              </ColorsProvider>
            </KeyboardProvider>
          </ThemeProvider>
        </ClerkLoaded>
      </TinyBaseProvider>
    </ClerkProvider>
  );
}
