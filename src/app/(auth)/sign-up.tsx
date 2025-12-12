import { Text, TextInput, View } from '@/src/components/Themed';
import * as React from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { isClerkAPIResponseError, useAuth, useSignUp } from '@clerk/clerk-expo';
import { Link, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const colors = useColors();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'The authentication service is loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);

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
      console.error('Sign-up error:', JSON.stringify(err, null, 2));
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage =
          err.errors[0].longMessage ||
          err.errors[0].message ||
          'Sign-up failed. Please check your email and password.';
        Alert.alert('Sign-Up Failed', errorMessage);
      } else {
        Alert.alert('Sign-Up Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'The authentication service is loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);

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
        console.error('Verification incomplete:', JSON.stringify(signUpAttempt, null, 2));
        Alert.alert(
          'Verification Incomplete',
          'Please check the verification code and try again.',
        );
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Error during verification:', err);
      console.error(JSON.stringify(err, null, 2));
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage =
          err.errors[0].longMessage ||
          err.errors[0].message ||
          'Verification failed. Please check the code and try again.';
        Alert.alert('Verification Failed', errorMessage);
      } else {
        Alert.alert('Verification Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resending verification code
  const onResendCodePress = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'The authentication service is loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email. Please check your inbox and junk mail folder.',
      );
    } catch (err) {
      console.error('Error resending code:', err);
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage =
          err.errors[0].longMessage ||
          err.errors[0].message ||
          'Failed to resend verification code. Please try again.';
        Alert.alert('Resend Failed', errorMessage);
      } else {
        Alert.alert('Resend Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
            editable={!isLoading}
          />
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : (
            <>
              <ActionButton type={code ? 'action' : 'disabled'} onPress={onVerifyPress} title="Verify" />
              <ActionButton
                type="action"
                onPress={onResendCodePress}
                title="Resend Code"
                style={styles.resendButton}
              />
            </>
          )}
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
          editable={!isLoading}
        />
        <TextInput
          style={{ ...styles.input, backgroundColor: colors.neutral200 }}
          value={password}
          placeholderTextColor={colors.text}
          placeholder="Password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          editable={!isLoading}
        />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : (
          <ActionButton
            type={emailAddress && password ? 'action' : 'disabled'}
            onPress={onSignUpPress}
            title="Continue"
          />
        )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  resendButton: {
    marginTop: 10,
  },
});
