import { ImageViewerScreen } from '@/components/ImageViewerScreen';
import { View } from '@/components/Themed';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShowReceiptPage = () => {
  const { jobName, uri } = useLocalSearchParams<{ jobName: string; uri: string }>();

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Receipt Image`, headerShown: true }} />
        <ImageViewerScreen imageUri={uri} onClose={() => router.back()} />
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
