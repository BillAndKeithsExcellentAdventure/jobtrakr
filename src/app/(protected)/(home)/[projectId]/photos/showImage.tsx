import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { ZoomImageViewer } from '@/src/components/ZoomImageViewer';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  RecentMediaEntryDateCompare,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { setImageCaption } from '@/src/utils/images';
import { useAuth } from '@clerk/clerk-expo';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShowProjectPhotoPage = () => {
  const { uri, projectId, projectName, photoDate, imageId } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    uri: string;
    photoDate: string;
    imageId?: string;
  }>();
  const { orgId, userId, getToken } = useAuth();
  const router = useRouter();
  const { isConnected } = useNetwork();
  const allImages = useAllRows(projectId, 'mediaEntries', RecentMediaEntryDateCompare);
  const updateMediaEntry = useUpdateRowCallback(projectId, 'mediaEntries');
  const colors = useColors();
  const currentImage = useMemo(
    () => (imageId ? allImages.find((image) => image.imageId === imageId) : undefined),
    [imageId, allImages],
  );
  const caption = currentImage?.caption || '';
  const handleCaptionChange = useCallback(
    (newCaption: string) => {
      if (currentImage?.id) updateMediaEntry(currentImage.id, { caption: newCaption });
    },
    [currentImage, updateMediaEntry],
  );

  const handleBackPress = useCallback(async () => {
    if (currentImage && imageId && orgId && userId && isConnected) {
      try {
        await setImageCaption(userId, orgId, projectId, imageId, caption, getToken);
        console.log('Image caption on server updated successfully');
      } catch (error) {
        console.error('Failed to set image caption:', error);
      }
    }
    router.back();
  }, [router, currentImage, imageId, projectId, caption, orgId, userId, getToken, isConnected]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Project Photo',
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <View>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text txtSize="title" text={photoDate} />
          </View>
          {imageId && (
            <TextField
              style={{ margin: 10, backgroundColor: colors.neutral200, padding: 8, borderRadius: 4 }}
              placeholder="Caption"
              value={caption}
              multiline={true}
              numberOfLines={2}
              onChangeText={handleCaptionChange}
            />
          )}
        </View>

        <View style={styles.container}>
          <Stack.Screen
            options={{
              title: projectName,
              headerShown: true,
              headerBackTitle: '',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <ZoomImageViewer imageUri={uri} />
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

export default ShowProjectPhotoPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
