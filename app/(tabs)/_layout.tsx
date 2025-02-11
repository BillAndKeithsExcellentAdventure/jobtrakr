import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useSession } from '@/context/AuthSessionContext';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function AntTabBarIcon(props: { name: React.ComponentProps<typeof AntDesign>['name']; color: string }) {
  return <AntDesign size={28} style={{ marginBottom: -3 }} {...props} />;
}

function EntypoTabBarIcon(props: { name: React.ComponentProps<typeof Entypo>['name']; color: string }) {
  return <Entypo size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { signOut } = useSession();

  return (
    <Tabs>
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          headerShown: false,
          tabBarIcon: ({ color }) => <EntypoTabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <AntTabBarIcon name="camera" color={color} />,
        }}
      />
    </Tabs>
  );
}
