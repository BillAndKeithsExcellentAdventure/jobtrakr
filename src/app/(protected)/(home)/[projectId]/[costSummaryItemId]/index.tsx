import { ActionButton } from '@/src/components/ActionButton';
import { NumberInputField } from '@/src/components/NumberInputField';
import { Switch } from '@/src/components/Switch';
import { Text, View } from '@/src/components/Themed';
import {
  useAllRows,
  useBidAmountUpdater,
  useDeleteRowCallback,
  useUpdateRowCallback,
  useWorkItemSpentValue,
  WorkItemSummaryData,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CostItemDetails = () => {
  const { projectId, costSummaryItemId, sectionCode, itemCode, itemTitle } = useLocalSearchParams<{
    projectId: string;
    costSummaryItemId: string;
    sectionCode: string;
    itemCode: string;
    itemTitle: string;
  }>();
  const [itemEstimate, setItemEstimate] = useState(0);
  const [itemComplete, setItemComplete] = useState(false);
  const router = useRouter();
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateBidEstimate = useUpdateRowCallback(projectId, 'workItemSummaries');
  const deleteCostSummary = useDeleteRowCallback(projectId, 'workItemSummaries');

  useBidAmountUpdater(projectId);

  const workItemSummary: WorkItemSummaryData | null = useMemo(() => {
    const workItem = allWorkItemSummaries.find((item) => item.id === costSummaryItemId);
    if (workItem) {
      return {
        ...workItem,
      };
    }
    return null;
  }, [allWorkItemSummaries, costSummaryItemId]);

  const amountSpent = useWorkItemSpentValue(projectId, workItemSummary ? workItemSummary.workItemId : '');

  useEffect(() => {
    setItemEstimate(workItemSummary ? workItemSummary.bidAmount : 0);
    setItemComplete(workItemSummary ? workItemSummary.complete : false);
  }, [workItemSummary]);

  const handleEstimateChanged = useCallback(
    (value: number) => {
      if (workItemSummary) updateBidEstimate(workItemSummary.id, { bidAmount: value });
      setItemEstimate(value);
    },
    [workItemSummary, updateBidEstimate],
  );

  const handleCompleteChanged = useCallback(
    (value: boolean) => {
      if (workItemSummary) updateBidEstimate(workItemSummary.id, { complete: value });
      setItemComplete(value);
    },
    [workItemSummary, updateBidEstimate],
  );

  const handleRemove = useCallback(() => {
    if (!workItemSummary) return;

    Alert.alert('Delete Cost Summary Item', 'Are you sure you want to delete this cost item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const result = deleteCostSummary(workItemSummary.id);
          if (result.status === 'Success') {
            router.back();
          } else {
            Alert.alert('Unable to Delete Item', 'Unable to delete the cost item');
          }
        },
      },
    ]);
  }, [workItemSummary, deleteCostSummary, router]);

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
          <>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text txtSize="title" text={`${sectionCode}.${itemCode}`} />
                <Text txtSize="title" text={`${itemTitle}`} style={{ flex: 1, marginLeft: 5 }} />
              </View>
              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  text="Estimate"
                  txtSize="standard"
                  style={{ textAlign: 'right', width: 90, marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <NumberInputField
                    value={itemEstimate}
                    onChange={handleEstimateChanged}
                    placeholder="Estimated Amount"
                  />
                </View>
              </View>
              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  text="Spent"
                  txtSize="standard"
                  style={{ textAlign: 'right', width: 90, marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <NumberInputField
                    value={amountSpent}
                    placeholder="Amount Spent"
                    onChange={() => {}}
                    readOnly
                  />
                </View>
              </View>
              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ alignItems: 'flex-end', width: 90, marginEnd: 10 }}>
                  <Switch value={itemComplete} onValueChange={handleCompleteChanged} size="large" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    text="All spending entries for this code have been entered"
                    txtSize="standard"
                    numberOfLines={2}
                    style={{ flexShrink: 1, flexWrap: 'wrap' }}
                  />
                </View>
              </View>
            </View>

            {0 === workItemSummary.bidAmount && 0 === amountSpent && (
              <View style={{ paddingBottom: Platform.OS === 'android' ? 30 : 0 }}>
                <ActionButton title="Remove this cost item" onPress={handleRemove} type={'cancel'} />
              </View>
            )}
          </>
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
