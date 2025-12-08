import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { getOrganizationSlug } from '@/src/utils/organization';
import { useAuth, useClerk, useOrganizationList, useSignUp } from '@clerk/clerk-expo';
import { Redirect, Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateOrganization() {
  const clerk = useClerk();
  const colors = useColors();
  const { isLoaded } = useSignUp();
  const router = useRouter();
  const [organizationName, setOrganizationName] = React.useState('');
  const [organizationExists, setOrganizationExists] = React.useState(false);
  const auth = useAuth();
  const { setActive } = useOrganizationList();

  useEffect(() => {
    if (auth) {
      if (auth.orgId) {
        setOrganizationExists(true);
      }
    }
  }, [auth]);

  const createOrganization = async (
    token: string,
    userId: string,
    name: string,
    slug: string,
    isDevDeployment?: boolean,
  ) => {
    try {
      const organizationData = {
        name: name,
        userId: userId,
        slug: slug,
        isDev: !!isDevDeployment,
      };
      console.log(' token:', token);
      const response = await fetch(`${API_BASE_URL}/addOrganization`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response:', errorBody);
        Alert.alert('Error', `HTTP error! status: ${response.status}. Response: ${errorBody}`, [
          {
            text: 'Report Error',
            onPress: () => {
              throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
            },
          },
        ]);
        return;
      }

      const data = await response.json();
      if (data && data.id && setActive) {
        setActive({ organization: data.id }); // Set the created organization as active
      }
      console.log('Organization created:', data);
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  // Handle submission of verification form
  const onCreateOrganizationPress = async () => {
    if (!isLoaded) return;

    try {
      //console.log('onCreateOrganizationPress-Auth:', auth);
      //console.log('onCreateOrganizationPress-Clerk:', clerk);
      if (clerk && clerk.session) {
        const token = await auth.getToken();
        if (token && auth.userId) {
          // Determine deployment type. Use NODE_ENV when available, fall back to React Native __DEV__.
          const isDev =
            (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
            (global as any).__DEV__ === true;

          await createOrganization(
            token,
            auth.userId,
            organizationName,
            getOrganizationSlug(organizationName),
            isDev,
          );
          console.log('Organization created successfully');
        }
      }
      router.replace('/');
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      Alert.alert('Error', `Error during create organization:: ${err}`, [
        {
          text: 'Report Error',
          onPress: () => {
            console.error('Error during create organization:', err);
            console.error(JSON.stringify(err, null, 2));
          },
        },
      ]);
    }
  };

  if (organizationExists) {
    return <Redirect href="/" />;
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
          placeholderTextColor={colors.text}
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
