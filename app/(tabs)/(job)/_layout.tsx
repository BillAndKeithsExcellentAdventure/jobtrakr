import { View, Text } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name='details' options={{ headerShown: false }} />
      <Stack.Screen name='[id]'  />
    </Stack>
  );
};

export default Layout;
