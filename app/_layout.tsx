import { useColorScheme } from '@/components/useColorScheme';
import { SessionProvider } from '@/context/AuthSessionContext';
import { DatabaseHostProvider } from '@/context/DatabaseContext';
import { LoggerHostProvider } from '@/context/LoggerContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CategoriesStore from '@/tbStores/ConfigurationStore';
import { Provider as TinyBaseProvider } from 'tinybase/ui-react';

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

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <DatabaseHostProvider>
          <TinyBaseProvider>
            <CategoriesStore />
            <LoggerHostProvider>
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
            </LoggerHostProvider>
          </TinyBaseProvider>
        </DatabaseHostProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
