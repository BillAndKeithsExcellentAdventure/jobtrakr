import { useAuth, useClerk , isClerkRuntimeError } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Text, TouchableOpacity } from 'react-native';

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const clerk = useClerk();
  const { getToken } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      if (!clerk) {
        console.error('Clerk is not initialized');
        return;
      }

      await clerk.signOut();
      console.log('Signed out successfully!');
      // Redirect to your desired page
      Linking.openURL(Linking.createURL('/'));
      console.log('Redirected to home page');
    } catch (err) {
      if (isClerkRuntimeError(err) && err.code === 'network_error') {
        console.error('Network error occurred!');
      }
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Error signing out:', err);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text style={{ fontSize: 40 }}>Sign outx</Text>
    </TouchableOpacity>
  );
};
