import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatCurrency } from '@/utils/formatters';
import {
  useAddRowCallback,
  useAllRows,
  WorkItemSummaryData,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';

const CostItemDetails = () => {
  const { jobId, costSummaryItemId } = useLocalSearchParams<{
    jobId: string;
    costSummaryItemId: string;
  }>();

  const allWorkItemSummaries = useAllRows(jobId, 'workItemSummaries');
  const addWorkItemSummary = useAddRowCallback(jobId, 'workItemSummaries');

  const colorScheme = useColorScheme();
  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            borderColor: Colors.light.borderColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const workItemSummary: WorkItemSummaryData | null = useMemo(() => {
    const workItem = allWorkItemSummaries.find((item) => item.workItemId === costSummaryItemId);
    if (workItem) {
      return {
        ...workItem,
      };
    }
    return null;
  }, [allWorkItemSummaries, costSummaryItemId]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Cost Item Details',
        }}
      />
      <View style={styles.container}>
        {!workItemSummary ? (
          <Text>No Cost Item Found</Text>
        ) : (
          <Text text={formatCurrency(workItemSummary.bidAmount, false, true)} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default CostItemDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
