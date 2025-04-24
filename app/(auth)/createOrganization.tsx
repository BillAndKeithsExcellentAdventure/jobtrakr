import * as React from 'react';
import { TextInput, Text, View } from '@/components/Themed';
import { TouchableOpacity } from 'react-native';
import { useSignUp, useClerk, useAuth, useOrganizationList } from '@clerk/clerk-expo';
import { Link, Redirect, Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useEffect } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { ActionButton } from '@/components/ActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateOrganization() {
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

  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const clerk = useClerk();
  const [organizationName, setOrganizationName] = React.useState('');
  const [organizationExists, setOrganizationExists] = React.useState(false);
  const [code, setCode] = React.useState('');
  const auth = useAuth();
  const { setActive } = useOrganizationList();

  useEffect(() => {
    if (auth) {
      if (auth.orgId) {
        setOrganizationExists(true);
      }
    }
  }, [auth]);

  const createOrganization = async (token: string, userId: string, name: string, slug: string) => {
    try {
      const organizationData = {
        name: name,
        userId: userId,
        slug: slug,
      };
      console.log(' token:', token);
      const response = await fetch(
        'https://projecthoundbackend.keith-m-bertram.workers.dev/addOrganization',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(organizationData),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
      }

      const data = await response.json();
      if (data && data.id && setActive) {
        setActive({ organization: data.id }); // Set the created organization as active
      }
      console.log('Organization created:', data);
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  // Handle submission of sign-up form
  const onInvitePress = async () => {
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle submission of verification form
  const onCreateOrganizationPress = async () => {
    if (!isLoaded) return;

    try {
      console.log('Auth:', auth);
      console.log('Clerk:', clerk);
      if (clerk && clerk.session) {
        const token = await auth.getToken();
        if (token && auth.userId) {
          await createOrganization(
            token,
            auth.userId,
            organizationName,
            `ph-${organizationName.toLocaleLowerCase()}`,
          );
          console.log('Organization created successfully');
        }
      }
      router.replace('/');
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Error during create organization:', err);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (organizationExists) {
    return <Redirect href="/projects" />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Organization',
          headerTitleAlign: 'center',
        }}
      />

      <View style={styles.container}>
        <Text txtSize="xl" text="Create Organization" style={{ marginBottom: 20 }} />
        <TextInput
          style={{ ...styles.input, backgroundColor: colors.neutral200 }}
          autoCapitalize="none"
          value={organizationName}
          placeholderTextColor={colors.textColor}
          placeholder="Enter Organization name"
          onChangeText={(orgName) => setOrganizationName(orgName)}
        />
        <ActionButton
          type={organizationName ? 'action' : 'disabled'}
          onPress={onCreateOrganizationPress}
          title="Create Organization"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
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
