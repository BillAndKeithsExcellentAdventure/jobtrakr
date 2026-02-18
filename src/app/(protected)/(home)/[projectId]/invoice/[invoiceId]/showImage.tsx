import { ZoomImageViewer } from '@/src/components/ZoomImageViewer';
import { View } from '@/src/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShowInvoicePage = () => {
  const { uri } = useLocalSearchParams<{ projectId: string; invoiceId: string; uri: string }>();
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: `Invoice Image`,
            headerShown: true,
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <ZoomImageViewer imageUri={uri} />
      </View>
    </SafeAreaView>
  );
};

export default ShowInvoicePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
