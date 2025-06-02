import { useState } from 'react';
import { View, TextInput, Alert, StyleSheet } from 'react-native';
import { useOrganization } from '@clerk/clerk-expo';
import { inviteUserToOrganization } from '../../../utils/organization';
import { ActionButton } from '../../../components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';

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
    <View style={{ gap: 10 }}>
      <TextInput
        style={{ ...styles.input, color: 'white', backgroundColor: colors.neutral200 }}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ActionButton onPress={handleInvite} title="Send Invitation" type="action" />
    </View>
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
