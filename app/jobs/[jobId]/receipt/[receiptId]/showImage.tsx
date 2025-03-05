import { ZoomImageViewer } from '@/components/ZoomImageViewer';
import { View } from '@/components/Themed';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShowReceiptPage = () => {
  const { uri } = useLocalSearchParams<{ jobId: string; receiptId: string; uri: string }>();
  console.log(`useLocalSearchParams uri=${uri}`);
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Receipt Image`, headerShown: true }} />
        <ZoomImageViewer imageUri={uri} />
      </View>
    </SafeAreaView>
  );
};

export default ShowReceiptPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
