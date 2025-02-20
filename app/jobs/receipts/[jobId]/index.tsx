import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';
import { ActionButton } from '@/components/ActionButton';
import { Text, View } from '@/components/Themed';
import { useJobDb } from '@/context/DatabaseContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet } from 'react-native';

const JobReceiptsPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [receipts, setReceipts] = useState<ReceiptBucketData[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  const { jobDbHost } = useJobDb();

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await jobDbHost?.GetReceiptBucketDB().FetchJobReceipts(jobId);

      if (!response) return;

      if (response.status === 'Success' && response.data) {
        setReceipts(response.data);
      }
    } catch (err) {
      alert('An error occurred while fetching the receipts');
      console.log('An error occurred while fetching the receipts', err);
    }
  }, [jobId, jobDbHost]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleAddReceipt = useCallback(() => {
    setIsAddModalVisible(true);
  }, []);

  const hideAddModal = useCallback(
    (success: boolean): void => {
      setIsAddModalVisible(false);
      if (success) fetchReceipts();
    },
    [fetchReceipts],
  );

  const showPicture = useCallback((PictureUri: string) => {
    // TODO
  }, []);

  const addPicture = useCallback((_id: string | undefined) => {
    // TODO
  }, []);

  const [isSwitchOn, setIsSwitchOn] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={{ padding: 20 }}>
        <View style={{ marginHorizontal: 10, marginBottom: 20 }}>
          <ActionButton onPress={handleAddReceipt} type={'action'} title="Add Receipt" />
        </View>

        <Text text="Job Receipts" txtSize="title" />
        <View style={{ marginVertical: 20 }}>
          {receipts.length === 0 ? (
            <View style={{ alignItems: 'center' }}>
              <Text>No receipts found.</Text>
            </View>
          ) : (
            <FlatList
              data={receipts}
              keyExtractor={(item) => item._id!}
              renderItem={({ item }) => (
                <View style={{ marginVertical: 10, padding: 10, borderWidth: 1 }}>
                  <Text>Amount: ${item.Amount}</Text>
                  <Text>Vendor: {item.Vendor}</Text>
                  <Text>Description: {item.Description}</Text>
                  <Text>Notes: {item.Notes}</Text>
                  <ActionButton
                    title={item.PictureUri ? 'Show Picture' : 'Add Picture'}
                    onPress={(): void => {
                      item.PictureUri ? showPicture(item.PictureUri) : addPicture(item._id);
                    }}
                    type={'action'}
                  />
                </View>
              )}
            />
          )}
        </View>
        <AddReceiptModalScreen jobId="{jobId}" visible={isAddModalVisible} hideModal={hideAddModal} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default JobReceiptsPage;
