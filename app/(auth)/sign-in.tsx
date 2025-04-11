import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Colors } from '@/constants/Colors';

export default function Page() {
  const auth = useAuth();

  return (
    <>
      <SignedIn>
        {auth && auth.orgId ? <Redirect href="/jobs" /> : <Redirect href="/(auth)/createOrganization" />}
      </SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </>
  );
}

function SignInForm() {
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

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
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
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.listBackground }}>
      <Text style={{ ...styles.title, backgroundColor: colors.listBackground }}>Sign In</Text>
      <TextInput
        style={{ ...styles.input, color: colors.textColor }}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor={colors.textColor}
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
      />
      <TextInput
        style={{ ...styles.input, color: colors.textColor }}
        value={password}
        placeholder="Enter password"
        placeholderTextColor={colors.textColor}
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      <TouchableOpacity style={styles.button} onPress={onSignInPress}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={{ color: colors.textColor }}>Don't have an account? </Text>
        <Link href="/sign-up">
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </View>
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
