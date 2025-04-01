import { ConfigurationEntry } from '@/components/ConfigurationEntry';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const home = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
        }}
      />

      <View style={{ alignItems: 'center', paddingTop: 10, backgroundColor: colors.listBackground }}>
        <Text txtSize="title" text="Job+" style={{ marginBottom: 5 }} />
        <Text
          txtSize="standard"
          text="version 1.0.1"
          style={{ marginBottom: 10, backgroundColor: colors.listBackground }}
        />
      </View>
      <View style={{ flex: 1, width: '100%', paddingHorizontal: 10, backgroundColor: colors.listBackground }}>
        <ConfigurationEntry
          label="Categories"
          description="Manage work categories"
          onPress={() => router.push('/jobs/configuration/workcategory/workCategories')}
        />
        <ConfigurationEntry
          label="Vendors"
          description="Add and Edit Vendors"
          onPress={() => router.push('/jobs/configuration/vendor/vendors')}
        />
        <ConfigurationEntry
          label="Job Templates"
          description="Define Job-specific Work Items"
          onPress={() => router.push('/jobs/configuration/template/templates')}
        />
      </View>
    </SafeAreaView>
  );
};

export default home;
