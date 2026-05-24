import React from 'react';
import { Stack } from 'expo-router';

export default function EulaLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, headerBackTitle: '', headerBackButtonDisplayMode: 'minimal' }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'End User License Agreement',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="view"
        options={{
          title: 'EULA',
          presentation: 'modal',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
