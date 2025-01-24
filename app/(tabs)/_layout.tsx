import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useSession } from '@/session/ctx';

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
        name='home'
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <EntypoTabBarIcon name='home' color={color} />,
          headerRight: () => (
            <>
              <Pressable
                onPress={() => {
                  signOut();
                  router.replace('/(auth)/auth');
                }}
              >
                {({ pressed }) => (
                  <AntDesign
                    name='logout'
                    size={24}
                    color={colorScheme === 'light' ? 'black' : 'white'}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </>
          ),
        }}
      />
      <Tabs.Screen
        name='two'
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <AntTabBarIcon name='camera' color={color} />,
        }}
      />
    </Tabs>
  );
}
