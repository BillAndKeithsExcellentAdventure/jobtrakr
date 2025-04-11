import * as React from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSignUp, useClerk, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const colors = React.useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
            textColor: Colors.dark.text,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            textColor: Colors.light.text,
          },
    [colorScheme],
  );

  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const clerk = useClerk();
  const [organization, setOrganization] = React.useState('');
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
        if (auth) {
          const token = await auth.getToken();
          if (token && auth.userId) {
            await createOrganization(token, auth.userId, 'BKEA', 'bkea-organization');
            console.log('Organization created successfully');
          }
        }
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
      <>
        <Text style={{ ...styles.title, color: colors.textColor }}>Verify your email</Text>
        <TextInput
          style={{ ...styles.input, color: colors.textColor }}
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
        />
        <TouchableOpacity onPress={onVerifyPress}>
          <Text style={{ ...styles.input, color: colors.textColor }}>Verify</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View>
      <>
        <Text>Sign up</Text>
        <TextInput
          style={{ ...styles.input, color: colors.textColor }}
          autoCapitalize="none"
          value={emailAddress}
          placeholderTextColor={colors.textColor}
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
        />
        <TextInput
          style={{ ...styles.input, color: colors.textColor }}
          value={password}
          placeholderTextColor={colors.textColor}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        <TouchableOpacity onPress={onSignUpPress}>
          <Text style={{ ...styles.input, color: colors.textColor }}>Continue</Text>
        </TouchableOpacity>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
          <Text style={{ ...styles.input, color: colors.textColor }}>Already have an account?</Text>
          <Link href="/sign-in">
            <Text style={{ ...styles.input, color: colors.textColor }}>Sign in</Text>
          </Link>
        </View>
      </>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: '#007AFF',
  },
} as const;
