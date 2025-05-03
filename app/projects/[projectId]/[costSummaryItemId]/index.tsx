import { Text, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import {
  useAddRowCallback,
  useAllRows,
  WorkItemSummaryData,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CostItemDetails = () => {
  const { projectId, costSummaryItemId } = useLocalSearchParams<{
    projectId: string;
    costSummaryItemId: string;
  }>();

  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const colors = useColors();
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
