import { ConfigurationEntry } from '@/components/ConfigurationEntry';
import { Text, View } from '@/components/Themed';
import { router, Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const home = () => {
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
        }}
      />

      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
        <Text txtSize="title" text="Job+" style={{ marginBottom: 5 }} />
        <Text txtSize="standard" text="version 1.0.1" style={{ marginBottom: 20 }} />
      </View>
      <View style={{ flex: 1, width: '100%', paddingHorizontal: 10 }}>
        <ConfigurationEntry
          label="Categories"
          description="Manage work categories"
          onPress={() => router.push('/jobs/configuration/categories')}
        />
        <ConfigurationEntry
          label="Vendors"
          description="Add and Edit Vendors"
          onPress={() => router.push('/jobs/configuration/vendors')}
        />
      </View>
    </SafeAreaView>
  );
};

export default home;
