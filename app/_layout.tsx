import { useColorScheme } from '@/components/useColorScheme';
import { SessionProvider } from '@/context/AuthSessionContext';
import { DatabaseHostProvider } from '@/context/DatabaseContext';
import { LoggerHostProvider } from '@/context/LoggerContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ConfigurationStore from '@/tbStores/ConfigurationStore';
import { Provider as TinyBaseProvider } from 'tinybase/ui-react';
import ProjectsStore from '@/tbStores/ListOfProjectsStore';
import { ActiveProjectIdProvider } from '@/context/ActiveProjectIdContext';
import ProjectDetailsStoreProvider from '@/tbStores/projectDetails/ProjectDetailsStore';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

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

//  afterSignOutUrl="/(auth)/sign-in"

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  console.log(`Publishable Key: ${PUBLISHABLE_KEY}`);
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionProvider>
          <DatabaseHostProvider>
            <TinyBaseProvider>
              <ConfigurationStore />
              <ProjectsStore />
              <ActiveProjectIdProvider>
                <ProjectDetailsStoreProvider />
                <SafeAreaProvider>
                  <GestureHandlerRootView>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="jobs" />
                      <Stack.Screen name="(auth)" />
                    </Stack>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                  </GestureHandlerRootView>
                </SafeAreaProvider>
              </ActiveProjectIdProvider>
            </TinyBaseProvider>
          </DatabaseHostProvider>
        </SessionProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

/*           
          

          
          */
