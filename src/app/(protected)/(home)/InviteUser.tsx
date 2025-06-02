import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useOrganization } from '@clerk/clerk-expo';
import { inviteUserToOrganization } from '@/src/utils/organization';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, View } from '@/src/components/Themed';

export const InviteUser = () => {
  const colors = useColors();
  const organization = useOrganization();
  const [email, setEmail] = useState('');

  const handleInvite = async () => {
    if (!email) {
      Alert.alert('Please enter an email address');
      return;
    }

    const result = await inviteUserToOrganization(organization.organization, email);

    if (result.status === 'success') {
      Alert.alert('Success', result.message);
      setEmail('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Invite User',
        }}
      />

      <View style={{ marginBottom: 10 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address of user to invite"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <ActionButton onPress={handleInvite} title="Send Invitation" type={email ? 'action' : 'disabled'} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  link: {
    color: '#007AFF',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
});

export default InviteUser;
