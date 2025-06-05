import { useState, useEffect } from 'react';
import { Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useOrganization, useUser } from '@clerk/clerk-expo';
import { inviteUserToOrganization } from '@/src/utils/organization';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, View, Text } from '@/src/components/Themed';

export const InviteUser = () => {
  const colors = useColors();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [numAdmins, setNumAdmins] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Add this useEffect to set the current user's ID
  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
      console.log('Current user ID:', user.id);
    }
  }, [user]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization) return;

      setIsLoading(true);
      try {
        const response = await organization.getMemberships();
        setMembers(response.data);

        // Count admin members
        const adminCount = response.data.filter((member) => member.role === 'org:admin').length;
        setNumAdmins(adminCount);

        console.log('Fetched members:', response.data.length);
        console.log('Number of admins:', adminCount);
      } catch (error) {
        console.error('Error fetching members:', error);
        Alert.alert('Error', 'Failed to fetch organization members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [organization]);

  const handleInvite = async () => {
    if (!email) {
      Alert.alert('Please enter an email address');
      return;
    }

    if (!organization) {
      Alert.alert('No organization found');
      return;
    }

    const result = await inviteUserToOrganization(organization, email);

    if (result.status === 'success') {
      Alert.alert('Success', result.message);
      setEmail('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleMakeAdmin = async (memberId: string) => {
    if (!organization) return;

    setIsLoading(true);
    try {
      console.log('Making member admin:', memberId);
      await organization.updateMember({ userId: memberId, role: 'org:admin' });
      const response = await organization.getMemberships();
      setMembers(response.data);
      setNumAdmins((prev) => prev + 1);
      Alert.alert('Success', 'Member role updated to admin');
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Error', 'Failed to update member role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAdmin = async (memberId: string) => {
    if (!organization) return;

    setIsLoading(true);
    try {
      console.log('Removing admin role:', memberId);
      await organization.updateMember({ userId: memberId, role: 'org:member' });
      const response = await organization.getMemberships();
      setMembers(response.data);
      setNumAdmins((prev) => prev - 1);
      Alert.alert('Success', 'Member role updated to member');
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Error', 'Failed to update member role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!organization) return;

    Alert.alert('Remove Member', `Are you sure you want to remove ${memberEmail} from the organization?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            await organization.removeMember(memberId);
            // Refresh members list
            const response = await organization.getMemberships();
            setMembers(response.data);
            Alert.alert('Success', 'Member removed from organization');
          } catch (error) {
            console.error('Error removing member:', error);
            Alert.alert('Error', 'Failed to remove member');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Team Members',
        }}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary100} />
        </View>
      ) : (
        <>
          <View
            style={{ marginBottom: 10, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 5 }}
          >
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address of user to invite"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <ActionButton onPress={handleInvite} title="Send Invitation" type={email ? 'action' : 'disabled'} />

          {members.length > 0 && (
            <View style={styles.membersContainer}>
              <Text style={[styles.memberTitle, { borderBottomColor: colors.border }]}>Current Members:</Text>
              {members.map((member) => (
                <View key={member.id} style={[styles.memberItem, { borderColor: colors.border }]}>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberRole}>{member.role.replace('org:', '')}</Text>
                    <Text style={styles.memberEmail}>{member.publicUserData.identifier}</Text>
                  </View>
                  {member.publicUserData.userId !== currentUserId && (
                    <View style={styles.memberButtonRow}>
                      {member.role === 'org:admin' ? (
                        numAdmins > 0 && member.publicUserData.userId !== currentUserId ? (
                          <TouchableOpacity
                            style={styles.removeAdminButton}
                            onPress={() => handleRemoveAdmin(member.publicUserData.userId)}
                          >
                            <Text style={styles.adminButtonText}>Remove Admin Role</Text>
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )
                      ) : (
                        <TouchableOpacity
                          style={styles.adminButton}
                          onPress={() => handleMakeAdmin(member.publicUserData.userId)}
                        >
                          <Text style={styles.adminButtonText}>Make Admin</Text>
                        </TouchableOpacity>
                      )}

                      {member.role !== 'org:admin' && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() =>
                            handleRemoveMember(member.publicUserData.userId, member.publicUserData.identifier)
                          }
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersContainer: {
    marginTop: 20,
    padding: 10,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 5,
    borderBottomWidth: 1,
  },
  memberItem: {
    borderBottomWidth: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 10,
  },

  adminButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  removeAdminButton: {
    backgroundColor: '#FF9500', // Orange color for warning
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  adminButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  memberRole: {
    width: 80, // Fixed width for role
    textTransform: 'capitalize',
  },
  memberEmail: {
    flex: 1, // Takes remaining space
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default InviteUser;
