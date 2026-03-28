import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useAllRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons'; // Right caret icon
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableProjectTemplate from '@/src/components/SwipeableProjectTemplate';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

const ListProjectTemplates = () => {
  const router = useRouter();
  const allProjectTemplates = useAllRows('templates');

  const colors = useColors();

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => router.push('/configuration/template/add')}
      hitSlop={10}
      style={styles.headerButton}
    >
      <Ionicons name="add" size={24} color={colors.iconColor} />
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Templates',
          headerRight: renderHeaderRight,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={allProjectTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SwipeableProjectTemplate projectTemplate={item} />}
              ListEmptyComponent={() => (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text txtSize="title" text="No project templates found." />
                  <Text text="Use the '+' in the upper right to add one." />
                </View>
              )}
            />
          </View>
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
});

export default ListProjectTemplates;
