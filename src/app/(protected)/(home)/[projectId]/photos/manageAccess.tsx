import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGrantPhotoAccessCallback } from '@/src/utils/images';

interface PhotoAccessEmail {
  id: string;
  email: string;
}

const SwipeableAddress = ({ item, onDelete }: { item: PhotoAccessEmail; onDelete: (id: string) => void }) => {
  const colors = useColors();

  const renderRightActions = () => (
    <View style={styles.deleteAction}>
      <Pressable onPress={() => onDelete(item.id)}>
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
          <Text txtSize="standard">{item.email}</Text>
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
  const [emails, setEmails] = useState<PhotoAccessEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const colors = useColors();
  const router = useRouter();
  const appSettings = useAppSettings();
  const grantPhotoAccess = useGrantPhotoAccessCallback();

  // Check if required app settings are defined
  const isAppSettingsComplete =
    appSettings.companyName?.trim() && appSettings.ownerName?.trim() && appSettings.email?.trim();

  const fetchPhotoAccessEmails = async () => {
    // TODO: Implement API call when endpoint is available
    // const response = await fetch(`/api/projects/{projectId}/photo-access`);
    // const data = await response.json();
    // setEmails(data);
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      return;
    }

    if (!projectId || !projectName) {
      Alert.alert('Error', 'Project information is missing.');
      return;
    }

    if (!appSettings.ownerName || !appSettings.email) {
      Alert.alert('Error', 'Company owner name and email are required.');
      return;
    }

    try {
      const result = await grantPhotoAccess(
        newEmail.trim(),
        projectId,
        projectName,
        appSettings.ownerName,
        appSettings.email,
      );

      if (result.success) {
        const newEntry: PhotoAccessEmail = {
          id: Date.now().toString(),
          email: newEmail.trim(),
        };

        setEmails([...emails, newEntry]);
        setNewEmail('');
        Alert.alert('Success', `Photo access granted to ${newEmail.trim()}`);
      } else {
        Alert.alert('Error', result.msg || 'Failed to grant photo access');
      }
    } catch (error) {
      console.error('Error granting photo access:', error);
      Alert.alert('Error', 'An unexpected error occurred while granting photo access');
    }
  };

  const handleDeleteEmail = (id: string) => {
    const emailToDelete = emails.find((item) => item.id === id);
    if (!emailToDelete) return;

    Alert.alert(
      'Remove Photo Access',
      `Are you sure you want to remove photo access for ${emailToDelete.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setEmails(emails.filter((item) => item.id !== id));
          },
        },
      ],
    );
  };

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
            Before granting photo access, the name and email of your company&apos;s owner or primary contact are
            required.
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
                  keyExtractor={(item) => item.id}
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
