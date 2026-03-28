import { Switch } from '@/src/components/Switch';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerDataCompareName,
  useAllRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableCustomer from '@/src/components/SwipeableCustomer';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

const CustomersScreen = () => {
  const router = useRouter();
  const allCustomers = useAllRows('customers', CustomerDataCompareName);
  const [showInactive, setShowInactive] = useState(false);

  const colors = useColors();

  const filteredCustomers = !showInactive ? allCustomers.filter((c) => !c.inactive) : allCustomers;

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => router.push('/configuration/customer/add')}
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
            title: 'Customers',
            headerRight: renderHeaderRight,
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={[styles.toggleContainer, { borderBottomColor: colors.border }]}>
            <Text>Show Inactive Customers</Text>
            <Switch value={showInactive} onValueChange={setShowInactive} />
          </View>
          <FlatList
            style={{ borderTopColor: colors.border }}
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SwipeableCustomer customer={item} />}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No customers found." />
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
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});

export default CustomersScreen;
