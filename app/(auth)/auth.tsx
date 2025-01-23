import { Redirect, router, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/session/ctx';

export default function SignIn() {
  const { signIn, session } = useSession();
  if (session) {
    <Redirect href='/(tabs)/home' />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ headerShown: true, title: 'Login to JobTrakR' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{ fontSize: 40 }}
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
