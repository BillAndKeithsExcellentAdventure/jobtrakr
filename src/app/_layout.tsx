import { Text, View } from '@/src/components/Themed';
import { useColorScheme } from '@/src/components/useColorScheme';
import { Colors } from '@/src/constants/Colors';
import { ColorsProvider } from '@/src/context/ColorsContext';
import { NetworkProvider } from '@/src/context/NetworkContext';
import { FocusManagerProvider } from '@/src/hooks/useFocusManager';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
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

const isDev =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
  (global as any).__DEV__ === true;

// Import your Publishable Key
const CLERK_PUBLISHABLE_KEY = isDev
  ? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  : process.env.EXPO_PUBLIC_CLERK_PRODUCTION_PUBLISHABLE_KEY;

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

function ClerkLoadingWrapper({
  children,
  colorScheme,
}: {
  children: React.ReactNode;
  colorScheme: 'light' | 'dark';
}) {
  const { isLoaded } = useAuth();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const splashImage = useMemo(
    () =>
      colorScheme === 'dark'
        ? require('@/assets/images/splash-icon-light.png')
        : require('@/assets/images/splash-icon-dark.png'),
    [colorScheme],
  );

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text txtSize="sub-title">Loading login provider...</Text>
        <Image source={splashImage} style={styles.splashImage} contentFit="contain" />
      </View>
    );
  }

  return <>{children}</>;
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
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY}>
      <StatusBar style="auto" />
      <TinyBaseProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ClerkLoadingWrapper colorScheme={colorScheme ?? 'light'}>
            <KeyboardProvider>
              <ColorsProvider>
                <FocusManagerProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView>
                      <NetworkProvider>
                        {/* NetworkProvider also initializes AppSettingsStore */}

                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen
                            name="(auth)"
                            options={{
                              animation: 'none',
                              headerBackTitle: '',
                              headerBackButtonDisplayMode: 'minimal',
                            }}
                          />
                          <Stack.Screen
                            name="(protected)"
                            options={{
                              animation: 'none',
                              headerBackTitle: '',
                              headerBackButtonDisplayMode: 'minimal',
                            }}
                          />
                        </Stack>
                      </NetworkProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </FocusManagerProvider>
              </ColorsProvider>
            </KeyboardProvider>
          </ClerkLoadingWrapper>
        </ThemeProvider>
      </TinyBaseProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 300,
    height: 300,
    marginTop: 40,
  },
});
