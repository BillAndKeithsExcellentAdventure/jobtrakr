import { ZoomImageViewer } from '@/components/ZoomImageViewer';
import { View, Text } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShowJobPhotoPage = () => {
  const { uri, jobName, photoDate } = useLocalSearchParams<{
    projectId: string;
    jobName: string;
    uri: string;
    photoDate: string;
  }>();
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text txtSize="title" text={photoDate} />
      </View>
      <View style={styles.container}>
        <Stack.Screen options={{ title: jobName, headerShown: true }} />
        <ZoomImageViewer imageUri={uri} />
      </View>
    </SafeAreaView>
  );
};

export default ShowJobPhotoPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
