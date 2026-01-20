import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useFetchEmailsWithPhotoAccessCallback,
  useRevokePhotoAccessCallback,
  useGrantPhotoAccessCallback,
  useFetchPublicImageIdsCallback,
  useMakePhotosPublicCallback,
} from '@/src/utils/images';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RecentMediaEntryDateCompare,
  useAllRows,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

const SwipeableAddress = ({ item, onDelete }: { item: string; onDelete: (id: string) => void }) => {
  const colors = useColors();

  const renderRightActions = () => (
    <View style={styles.deleteAction}>
      <Pressable onPress={() => onDelete(item)}>
        <FontAwesome name="trash" size={28} color="white" />
      </Pressable>
    </View>
  );

  return (
    <Animated.View exiting={FadeOut}>
      <ReanimatedSwipeable renderRightActions={renderRightActions}>
        <View
          style={{
            ...styles.addressItem,
            borderColor: colors.border,

            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text txtSize="standard">{item}</Text>
          <View>
            <Feather name="chevrons-right" size={24} color={colors.iconColor} />
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
};

export default function ManageAccessScreen() {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const colors = useColors();
  const router = useRouter();
  const appSettings = useAppSettings();
  const fetchEmailsWithPhotoAccess = useFetchEmailsWithPhotoAccessCallback();
  const revokePhotoAccess = useRevokePhotoAccessCallback();
  const grantPhotoAccess = useGrantPhotoAccessCallback();
  const allProjectMedia = useAllRows(projectId, 'mediaEntries', RecentMediaEntryDateCompare);
  const fetchProjectPublicImageIds = useFetchPublicImageIdsCallback();
  const makePhotosPublic = useMakePhotosPublicCallback();
  const syncCompleteRef = useRef<string | null>(null);

  // Check if required app settings are defined
  const isAppSettingsComplete =
    appSettings.companyName?.trim() && appSettings.ownerName?.trim() && appSettings.email?.trim();

  // Reset sync state when projectId changes
  useEffect(() => {
    syncCompleteRef.current = null;
  }, [projectId]);

  // Synchronize local public photos with server
  useEffect(() => {
    const syncPublicPhotos = async () => {
      // Only sync once per project
      if (syncCompleteRef.current === projectId) {
        return;
      }

      if (!projectId || !allProjectMedia || allProjectMedia.length === 0) {
        return;
      }

      try {
        // Get public image IDs from server
        const serverResult = await fetchProjectPublicImageIds(projectId);
        if (!serverResult.success) {
          console.error('Failed to fetch server public image IDs:', serverResult.msg);
          return;
        }

        const serverImageIds = new Set(serverResult.imageIds || []);

        // Get public image IDs from local store
        const localPublicImageIds = allProjectMedia
          .filter((media) => media.isPublic && media.imageId)
          .map((media) => media.imageId!);

        const localPublicSet = new Set(localPublicImageIds);

        // Check if sets are different
        const needsSync =
          localPublicSet.size !== serverImageIds.size ||
          [...localPublicSet].some((id) => !serverImageIds.has(id));

        if (needsSync) {
          console.log('Syncing public photos to server. Local:', localPublicImageIds.length);
          const result = await makePhotosPublic(projectId, localPublicImageIds);
          if (result.success) {
            console.log('Successfully synced public photos to server');
          } else {
            console.error('Failed to sync public photos:', result.msg);
          }
        } else {
          console.log('Public photos already in sync with server');
        }

        // Mark sync as complete for this project
        syncCompleteRef.current = projectId;
      } catch (error) {
        console.error('Error syncing public photos:', error);
      }
    };
    syncPublicPhotos();
  }, [projectId, allProjectMedia, fetchProjectPublicImageIds, makePhotosPublic]);

  const loadEmails = useCallback(
    async (projectId: string) => {
      if (!projectId) return;

      const result = await fetchEmailsWithPhotoAccess(projectId);
      if (result.success && result.emails) {
        setEmails(result.emails);
      } else {
        console.error('Failed to fetch emails:', result.msg);
        Alert.alert('Error', `Failed to load email addresses: ${result.msg}`);
      }
    },
    [fetchEmailsWithPhotoAccess],
  );

  useEffect(() => {
    loadEmails(projectId);
     
  }, [projectId, loadEmails]); // Only run when projectId changes

  const handleAddEmail = useCallback(async () => {
    if (!newEmail.trim() || !projectId || !projectName) {
      return;
    }

    const result = await grantPhotoAccess(
      newEmail.trim(),
      projectId,
      projectName,
      appSettings.companyName,
      appSettings.email,
    );
    if (result.success) {
      setNewEmail('');
      // Reload the email list from server to get the updated list
      await loadEmails(projectId);
    } else {
      Alert.alert('Error', `Failed to grant access: ${result.msg}`);
    }
  }, [
    newEmail,
    projectId,
    projectName,
    grantPhotoAccess,
    appSettings.companyName,
    appSettings.email,
    loadEmails,
  ]);

  const handleDeleteEmail = useCallback(
    async (email: string) => {
      if (!projectId) return;

      Alert.alert('Remove Photo Access', `Are you sure you want to remove photo access for ${email}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await revokePhotoAccess(projectId);
            if (result.success) {
              // Reload the email list from server to get the updated list
              await loadEmails(projectId);
            } else {
              Alert.alert('Error', `Failed to revoke access: ${result.msg}`);
            }
          },
        },
      ]);
    },
    [projectId, revokePhotoAccess, loadEmails],
  );
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Manage Photo Access',
          headerBackTitle: 'Back',
        }}
      />
      {!isAppSettingsComplete ? (
        <View style={styles.messageContainer}>
          <Text txtSize="sub-title" style={{ color: colors.text }}>
            Before granting photo access, the name and email of your company&apos;s owner or primary contact
            are required.
          </Text>
          <Text txtSize="sub-title" style={{ color: colors.text }}>
            Please make sure the required data are defined in the company settings to continue.
          </Text>
          <ActionButton
            style={{ minWidth: 200 }}
            onPress={() => router.push('/appSettings/SetAppSettings')}
            type={'action'}
            title="Edit Company Settings"
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.container}>
            <View style={styles.inputSection}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ActionButton
                onPress={handleAddEmail}
                title="Add Email"
                type={newEmail.trim() ? 'action' : 'disabled'}
              />
            </View>

            <View style={styles.listSection}>
              <Text txtSize="sub-title" style={{ fontWeight: '600' }}>
                Addresses with Photo Access
              </Text>
              <Text txtSize="standard">
                Addresses listed below can view and download photos associated with this project.
              </Text>

              {emails.length > 0 ? (
                <FlashList
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  data={emails}
                  renderItem={({ item }) => <SwipeableAddress item={item} onDelete={handleDeleteEmail} />}
                  keyExtractor={(item) => item}
                />
              ) : (
                <Text txtSize="sub-title" style={styles.emptyText}>
                  No email addresses have access yet.
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },

  container: {
    flex: 1,
    padding: 16,
  },

  messageContainer: {
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },

  inputSection: {
    marginBottom: 24,
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listSection: {
    flex: 1,
    gap: 12,
  },
  addressItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,

    backgroundColor: '#FF3B30',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
});
