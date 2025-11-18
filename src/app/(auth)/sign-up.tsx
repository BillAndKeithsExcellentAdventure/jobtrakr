import { Text, TextInput, View } from '@/src/components/Themed';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { useAuth, useClerk, useSignUp } from '@clerk/clerk-expo';
import { Link, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const colors = useColors();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const clerk = useClerk();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const auth = useAuth();

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  /*--------------
  const createOrganization = async (token: string, userId: string, name: string, slug: string) => {
    try {
      const organizationData = {
        name: name,
        created_by: userId,
        slug: slug,
        max_allowed_memberships: 5,
      };
      const response = await fetch('https://api.clerk.com/v1/organizations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };
  --------------*/

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('Sign-up verification attempt:', signUpAttempt.status);

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        console.log('Sign-up verification completed successfully');
        console.log('  Ready to useAuth');
        console.log('Auth:', auth);
        /*-------- I can't understand why this is necessary here. It seems to work without it. -------
        if (auth) {
          const token = await auth.getToken();
          if (token && auth.userId) {
            await createOrganization(token, auth.userId, 'BKEA', 'bkea-organization');
            console.log('Organization created successfully');
          }
        }
        ---------------------*/
        router.replace('/');
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Error during verification:', err);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Verify Sign Up',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <Text
            txtSize="xl"
            style={{ marginBottom: 20, backgroundColor: colors.listBackground }}
            text="Verify your email"
          />
          <Text
            txtSize="standard"
            style={{ marginBottom: 20, backgroundColor: colors.listBackground }}
            text="If you don't see code quickly, check your junk mail folder."
          />
          <TextInput
            style={{ ...styles.input, backgroundColor: colors.neutral200 }}
            value={code}
            placeholder="Enter your verification code"
            onChangeText={(code) => setCode(code)}
          />
          <ActionButton type={code ? 'action' : 'disabled'} onPress={onVerifyPress} title="Verify" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sign Up',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        <Text
          txtSize="xl"
          style={{ marginBottom: 20, backgroundColor: colors.listBackground }}
          text="Sign Up"
        />
        <TextInput
          style={{ ...styles.input, backgroundColor: colors.neutral200 }}
          autoCapitalize="none"
          value={emailAddress}
          placeholderTextColor={colors.text}
          keyboardType="email-address"
          placeholder="Email"
          onChangeText={(email) => setEmailAddress(email)}
        />
        <TextInput
          style={{ ...styles.input, backgroundColor: colors.neutral200 }}
          value={password}
          placeholderTextColor={colors.text}
          placeholder="Password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        <ActionButton
          type={emailAddress && password ? 'action' : 'disabled'}
          onPress={onSignUpPress}
          title="Continue"
        />
        <View style={styles.footer}>
          <Text text="Already have an account?" style={{ backgroundColor: 'transparent', marginRight: 20 }} />
          <Link href="/sign-in">
            <Text style={styles.link}>Sign in</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

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
