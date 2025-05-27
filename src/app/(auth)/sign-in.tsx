import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { isClerkAPIResponseError, SignedIn, SignedOut, useAuth, useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, Stack, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Page() {
  const { orgId } = useAuth();

  return (
    <>
      <SignedIn>{orgId ? <Redirect href="/" /> : <Redirect href="/createOrganization" />}</SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </>
  );
}

function SignInForm() {
  const colors = useColors();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [resetCode, setResetCode] = React.useState('');
  const [showResetCode, setShowResetCode] = React.useState(false);

  const onResetPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password, // New password
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Log-in Error', err.errors[0].longMessage, [
          {
            text: 'Retry',
            onPress: () => {},
          },
          {
            text: 'Reset Password',
            onPress: async () => {
              try {
                // First create the reset password attempt - use the correct strategy
                const resetAttempt = await signIn.create({
                  strategy: 'reset_password_email_code',
                  identifier: emailAddress,
                });

                if (resetAttempt.status === 'needs_first_factor') {
                  Alert.alert(
                    'Reset Password Email Sent',
                    'Please check your email for the reset code. Enter the code and your new password below.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setPassword(''); // Clear the password field
                          setShowResetCode(true); // Show the reset code input
                        },
                      },
                    ],
                  );
                }
              } catch (error) {
                console.error('Error initiating password reset:', error);
                Alert.alert('Error', 'Failed to send reset password email. Please try again.');
              }
            },
          },
        ]);
      } else {
        // Handle non-Clerk API errors
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  }, [isLoaded, signIn, resetCode, password, setActive, router]);

  // Handle the submission of the sign-in form
  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        strategy: 'password',
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Log-in Error', err.errors[0].longMessage, [
          {
            text: 'Retry',
            onPress: () => {},
          },
          {
            text: 'Reset Password',
            onPress: async () => {
              try {
                // First create the reset password attempt - use the correct strategy
                const resetAttempt = await signIn.create({
                  strategy: 'reset_password_email_code',
                  identifier: emailAddress,
                });

                if (resetAttempt.status === 'needs_first_factor') {
                  Alert.alert(
                    'Reset Password Email Sent',
                    'Please check your email for the reset code. Enter the code and your new password below.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setPassword(''); // Clear the password field
                          setShowResetCode(true); // Show the reset code input
                        },
                      },
                    ],
                  );
                }
              } catch (error) {
                console.error('Error initiating password reset:', error);
                Alert.alert('Error', 'Failed to send reset password email. Please try again.');
              }
            },
          },
        ]);
      } else {
        // Handle non-Clerk API errors
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  }, [isLoaded, signIn, emailAddress, password, setActive, router]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sign In',
          headerTitleAlign: 'center',
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        <Text
          txtSize="xl"
          style={{ marginBottom: 20, backgroundColor: colors.listBackground }}
          text="Sign In"
        />
        <TextInput
          style={{ ...styles.input, backgroundColor: colors.neutral200 }}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email"
          keyboardType="email-address"
          placeholderTextColor={colors.text}
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />
        <TextInput
          style={{ ...styles.input, color: colors.text }}
          value={password}
          placeholder={showResetCode ? 'New Password' : 'Password'}
          placeholderTextColor={colors.text}
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        {showResetCode && (
          <TextInput
            style={{ ...styles.input, color: colors.text }}
            value={resetCode}
            placeholder="Reset Code"
            placeholderTextColor={colors.text}
            onChangeText={(code) => setResetCode(code)}
          />
        )}
        <ActionButton
          onPress={showResetCode ? onResetPress : onSignInPress}
          type={emailAddress && password ? 'action' : 'disabled'}
          title="Sign-in"
        />
        <View style={styles.footer}>
          <Text text="Don't have an account?" style={{ backgroundColor: 'transparent', marginRight: 20 }} />
          <Link href="/sign-up">
            <Text style={styles.link}>Sign up</Text>
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
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
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
