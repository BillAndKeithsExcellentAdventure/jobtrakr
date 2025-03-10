import { Redirect, router, Stack } from 'expo-router';
import { Text, useColorScheme, View } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';

export default function SignIn() {
  const colorScheme = useColorScheme();
  const { signIn, sessionUser } = useAuthSession();

  if (sessionUser) {
    return <Redirect href="/jobs" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ headerShown: true, title: 'Login to Job+' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{ color: colorScheme === 'light' ? 'black' : 'white', fontSize: 40 }}
          onPress={() => {
            signIn();
            router.replace('/jobs');
          }}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
}
