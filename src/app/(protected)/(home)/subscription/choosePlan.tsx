import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { useRefreshSubscription } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

const ChooseSubscriptionPlanScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const refreshSubscription = useRefreshSubscription();
  const { html, url } = useLocalSearchParams<{ html?: string; url?: string }>();

  const handleBackPress = useCallback(() => {
    refreshSubscription().catch((error: unknown) => {
      console.error('Failed to refresh subscription after plan selection:', error);
    });
    router.back();
  }, [refreshSubscription, router]);

  if (!html && !url) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: 'Choose Plan',
            headerShown: true,
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
          }}
        />
        <View style={styles.errorContainer}>
          <Text>Subscription page content is missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Choose Plan',
          headerShown: true,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <WebView
        source={html ? { html } : { uri: url! }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.buttonBlue} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default ChooseSubscriptionPlanScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
