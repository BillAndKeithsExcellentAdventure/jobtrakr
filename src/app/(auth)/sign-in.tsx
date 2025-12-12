import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { isClerkAPIResponseError, SignedIn, SignedOut, useAuth, useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, Stack, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
  const [showPassword, setShowPassword] = React.useState(false);

  const onForgotPasswordPress = useCallback(async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'The authentication service is loading. Please try again in a moment.', [
        {
          text: 'OK',
          onPress: () => {},
        },
      ]);
      return;
    }

    if (!emailAddress) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    try {
      // First create the reset password attempt
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
    } catch (error: any) {
      console.error('Error initiating password reset:', error);
      if (isClerkAPIResponseError(error)) {
        Alert.alert(
          'Error',
          error.errors[0].longMessage || 'Failed to send reset password email. Please try again.',
        );
      } else {
        Alert.alert('Error', 'Failed to send reset password email. Please try again.');
      }
    }
  }, [isLoaded, signIn, emailAddress]);

  const onResetPress = useCallback(async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'The authentication service is loading. Please try again in a moment.', [
        {
          text: 'OK',
          onPress: () => {},
        },
      ]);
      return;
    }

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
        Alert.alert('Password Reset Incomplete', 'Please check the code and try again.');
      }
    } catch (err: any) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Password Reset Error', err.errors[0].longMessage, [
          {
            text: 'OK',
            onPress: () => {},
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
        Alert.alert('Sign-In Incomplete', 'Please check your credentials and try again.');
      }
    } catch (err: any) {
      if (isClerkAPIResponseError(err)) {
        const errorMessage =
          err.errors[0].longMessage ||
          err.errors[0].message ||
          'Login failed. Please check your email and password.';
        Alert.alert('Login Failed', errorMessage, [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]);
      } else {
        // Handle non-Clerk API errors
        Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
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
          animation: 'none',
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
          spellCheck={false}
          keyboardType="email-address"
          placeholderTextColor={colors.text}
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />
        <View style={[styles.passwordContainer, { borderColor: colors.neutral400, backgroundColor: colors.neutral200 }]}>
          <TextInput
            style={{ ...styles.passwordInput, color: colors.text }}
            value={password}
            placeholder={showResetCode ? 'New Password' : 'Password'}
            placeholderTextColor={colors.text}
            secureTextEntry={!showPassword}
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
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
          title={showResetCode ? 'Reset Password' : 'Sign In'}
        />
        {showResetCode && (
          <ActionButton
            onPress={() => {
              setShowResetCode(false);
              setResetCode('');
              setPassword('');
            }}
            type="action"
            title="Cancel Reset"
            style={styles.cancelButton}
          />
        )}
        {!showResetCode && (
          <View style={styles.forgotPasswordContainer}>
            <Text text="Forgot password?" style={styles.link} onPress={onForgotPasswordPress} />
          </View>
        )}
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    marginTop: 10,
  },
  link: {
    color: '#007AFF',
    backgroundColor: 'transparent',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 4,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
  },
  eyeIcon: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
