// screens/ListVendors.tsx

import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows,
  VendorData,
  VendorDataCompareName,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Switch } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableVendor from '@/src/components/SwipeableVendor';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

const VendorsScreen = () => {
  const router = useRouter();
  const allVendors = useAllRows('vendors', VendorDataCompareName);
  const [showInactive, setShowInactive] = useState(false);

  const colors = useColors();

  const dataToDisplay = showInactive ? allVendors : allVendors.filter((v) => !v.inactive);

  const renderHeaderRight = () => (
    <Pressable
      // work around for https://github.com/software-mansion/react-native-screens/issues/2219
      // use Pressable from react-native-gesture-handler
      onPress={() => router.push('/configuration/vendor/add')}
      hitSlop={10}
      style={styles.headerButton}
    >
      <Ionicons name="add" size={24} color={colors.iconColor} />
    </Pressable>
  );

  return (
    <>
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Vendors/Merchants',
            headerRight: renderHeaderRight,
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={[styles.toggleContainer, { borderBottomColor: colors.border }]}>
            <Text>Show Inactive Vendors</Text>
            <Switch value={showInactive} onValueChange={setShowInactive} />
          </View>
          <FlatList
            style={{ borderTopColor: colors.border }}
            data={dataToDisplay}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SwipeableVendor vendor={item} />}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No vendors found." />
                <Text text="Use the '+' in the upper right to add one." />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  vendorInfo: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    paddingRight: 0,
    zIndex: 1,
  },
});

export default VendorsScreen;
