import { StyleSheet, SafeAreaView, FlatList, Button, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text, View, TextInput } from '@/components/Themed';
import { launchCamera } from 'react-native-image-picker';
import { useJobDb } from '@/context/DatabaseContext';
import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';

export interface JobReceiptData {
  _id?: string;
  UserId?: string;
  JobId?: string;
  Amount?: number;
  Vendor?: number;
  Description?: string;
  Notes?: string;
  CategoryName: string;
  ItemName: string;
  PictureBucketDataId?: string;
}

export interface PictureBucketData {
  _id?: string | null;
  UserId?: string | null;
  JobId?: string | null;
  DeviceId?: string | null;
  AlbumId?: string | null;
  AssetId?: string | null;
  Longitude?: number | null;
  Latitude?: number | null;
  DateAdded?: Date | null;
  PictureDate?: Date | null;
}

const JobReceiptsPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [receipts, setReceipts] = useState<JobReceiptData[]>([]);
  const [newReceipt, setNewReceipt] = useState<JobReceiptData>({
    CategoryName: '',
    ItemName: '',
    Amount: 0,
    Vendor: 0,
    Description: '',
    Notes: '',
  });
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  const { jobDbHost } = useJobDb();

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await jobDbHost?.GetTodoDB().FetchJobTodos(jobId);
      if (!response) return;

      if (response.status === 'Success') {
        setReceipts([]); // TODO
      }
    } catch (err) {
      alert('An error occurred while fetching the notes');
    }
  }, [jobId]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleAddReceipt = useCallback(() => {
    setIsAddModalVisible(true);
  }, []);

  const pictureData: PictureBucketData = {
    JobId: jobId,
    DateAdded: new Date(),
    PictureDate: new Date(),
    AssetId: pictureUri, // Storing picture URI in AssetId
  };

  const hideAddModal = useCallback(
    (success: boolean): void => {
      setIsAddModalVisible(false);
      if (success) fetchReceipts();
    },
    [fetchReceipts],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={{ padding: 20 }}>
        <Text text="Job Receipts" txtSize="title" />
        <View style={{ marginVertical: 20, borderBottomWidth: 1 }}>
          {receipts.length === 0 ? (
            <Text>No receipts found.</Text>
          ) : (
            <FlatList
              data={receipts}
              keyExtractor={(item) => item._id!}
              renderItem={({ item }) => (
                <View style={{ marginVertical: 10, padding: 10, borderWidth: 1 }}>
                  <Text>Category: {item.CategoryName}</Text>
                  <Text>Item: {item.ItemName}</Text>
                  <Text>Amount: ${item.Amount}</Text>
                  <Text>Vendor: {item.Vendor}</Text>
                  <Text>Description: {item.Description}</Text>
                  <Text>Notes: {item.Notes}</Text>
                  {item.PictureBucketDataId && <Text>Picture: {item.PictureBucketDataId}</Text>}
                </View>
              )}
            />
          )}
        </View>
        <Button title="Add Receipt" onPress={handleAddReceipt} />
        <AddReceiptModalScreen jobId="{jobId}" visible={isAddModalVisible} hideModal={hideAddModal} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default JobReceiptsPage;
