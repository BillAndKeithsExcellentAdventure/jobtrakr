import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';

const EulaViewScreen = () => {
  const colors = useColors();
  const { html } = useLocalSearchParams<{ html?: string }>();

  if (!html) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: 'EULA',
            headerShown: true,
            presentation: 'modal',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={styles.errorContainer}>
          <Text>EULA content is unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'EULA',
          headerShown: true,
          presentation: 'modal',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <WebView
        source={{ html }}
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

export default EulaViewScreen;

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
