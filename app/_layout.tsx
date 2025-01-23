import { Stack } from 'expo-router';
import React from 'react';

const Page = () => {
  return (
  <Stack>
    <Stack.Screen name='index' />
    <Stack.Screen name='(tabs)' options={{headerShown: false}} />
    <Stack.Screen name='(auth)' options={{headerShown: false}} />
  </Stack>
);
};

export default Page;