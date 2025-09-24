import { ConfigurationEntry } from '@/src/components/ConfigurationEntry';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const home = () => {
  const router = useRouter();
  const colors = useColors();
  const appVersion = Constants?.expoConfig?.version ?? 'unknown';

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuration',
        }}
      />

      <View style={{ alignItems: 'center', paddingTop: 10, backgroundColor: colors.listBackground }}>
        <Text txtSize="title" text="Project Hound" style={{ marginBottom: 5 }} />
        <Text
          txtSize="standard"
          text={`version ${appVersion}`}
          style={{ marginBottom: 10, backgroundColor: colors.listBackground }}
        />
      </View>
      <View style={{ flex: 1, width: '100%', paddingHorizontal: 10, backgroundColor: colors.listBackground }}>
        <ConfigurationEntry
          label="Categories"
          description="Manage work categories"
          onPress={() => router.push('/configuration/workcategory/workCategories')}
        />
        <ConfigurationEntry
          label="Project Templates"
          description="Define Project-specific Work Items"
          onPress={() => router.push('/configuration/template/templates')}
        />
        <ConfigurationEntry
          label="Vendors"
          description="Add and Edit Vendors"
          onPress={() => router.push('/configuration/vendor/vendors')}
        />
      </View>
    </SafeAreaView>
  );
};

export default home;
