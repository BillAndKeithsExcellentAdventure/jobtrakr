import { TextField } from '@/components/TextField';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditLineItemPage = () => {
  const { projectId, receiptId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    lineItemId: string;
  }>();

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            separatorColor: Colors.dark.separatorColor,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            separatorColor: Colors.light.separatorColor,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  return (
    <View>
      <Text>EditLineItemPage</Text>
    </View>
  );
};

export default EditLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    flex: 1,
    width: '100%',
  },
});
