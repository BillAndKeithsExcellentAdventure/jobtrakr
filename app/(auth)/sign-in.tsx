import { ActionButton } from '@/components/ActionButton';
import { TextInput, Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SignedIn, SignedOut, useAuth, useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function Page() {
  const auth = useAuth();

  return (
    <>
      <SignedIn>
        {auth && auth.orgId ? <Redirect href="/projects" /> : <Redirect href="/(auth)/createOrganization" />}
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
            neutral200: Colors.dark.neutral200,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            textColor: Colors.light.text,
            neutral200: Colors.light.neutral200,
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
          placeholderTextColor={colors.textColor}
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />
        <TextInput
          style={{ ...styles.input, color: colors.textColor }}
          value={password}
          placeholder="Password"
          placeholderTextColor={colors.textColor}
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        <ActionButton
          onPress={onSignInPress}
          type={emailAddress && password ? 'action' : 'disabled'}
          title="Sign In"
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
