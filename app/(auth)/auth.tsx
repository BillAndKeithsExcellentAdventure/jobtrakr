import { Redirect, router, Stack } from 'expo-router';
import { Text, useColorScheme, View } from 'react-native';

import { useSession } from '@/context/AuthSessionContext';

export default function SignIn() {
  const colorScheme = useColorScheme();
  const { signIn, session } = useSession();
  if (session) {
    <Redirect href="/(tabs)/home" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ headerShown: true, title: 'Login to JobTrakR' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{ color: colorScheme === 'light' ? 'black' : 'white', fontSize: 40 }}
          onPress={() => {
            signIn();
            router.replace('/(tabs)/home');
          }}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
}
