import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';
import { ActionButton } from '@/components/ActionButton';
import { ModalImageViewer } from '@/components/ModalImageViewer';
import { Text, View } from '@/components/Themed';
import { useJobDb } from '@/context/DatabaseContext';
import { formatCurrency } from '@/utils/formatters';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet } from 'react-native';

const JobReceiptsPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [receipts, setReceipts] = useState<ReceiptBucketData[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

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

  const showPicture = useCallback((uri: string) => {
    setSelectedImage(uri);
    setIsImageViewerVisible(true);
  }, []);

  const addPicture = useCallback((_id: string | undefined) => {
    // TODO
  }, []);

  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const handleRemoveReceipt = useCallback(async (id: string | undefined) => {
    if (id !== undefined) {
      const response = await jobDbHost?.GetReceiptBucketDB().DeleteReceipt(id);
      fetchReceipts();
    }
  }, []);

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
              keyExtractor={(item, index) => item._id ?? index.toString()}
              renderItem={({ item }) => (
                <View style={{ marginVertical: 10, padding: 10, borderWidth: 1 }}>
                  <Text>Amount: {formatCurrency(item.Amount)}</Text>
                  <Text>Vendor: {item.Vendor}</Text>
                  <Text>Description: {item.Description}</Text>
                  <Text>Notes: {item.Notes}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <ActionButton
                      title={item.PictureUri ? 'Show Picture' : 'Add Picture'}
                      onPress={(): void => {
                        item.PictureUri ? showPicture(item.PictureUri) : addPicture(item._id);
                      }}
                      type={'action'}
                    />
                    <ActionButton
                      title="Remove"
                      onPress={(): void => {
                        handleRemoveReceipt(item._id);
                      }}
                      type={'action'}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
        <>
          <AddReceiptModalScreen jobId={jobId} visible={isAddModalVisible} hideModal={hideAddModal} />
          {selectedImage && (
            <ModalImageViewer
              isVisible={isImageViewerVisible}
              imageUri={selectedImage}
              onClose={() => setIsImageViewerVisible(false)}
            />
          )}
        </>
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
