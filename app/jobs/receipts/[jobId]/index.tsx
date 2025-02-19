import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';
import { ActionButton } from '@/components/ActionButton';
import { Switch } from '@/components/Switch';
import { Text, View } from '@/components/Themed';
import { useJobDb } from '@/context/DatabaseContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet } from 'react-native';

export interface JobReceiptData {
  _id?: string;
  UserId?: string;
  JobId?: string;
  Amount?: number;
  Vendor?: string;
  Description?: string;
  Notes?: string;
  CategoryName: string;
  ItemName: string;
  PictureUri?: string;
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
    Vendor: '',
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

        <View
          style={{
            marginHorizontal: 10,
            marginBottom: 20,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text text="Near Job" txtSize="standard" style={{ marginRight: 10 }} />
          <Switch value={isSwitchOn} onValueChange={setIsSwitchOn} />
          <Text text="All" txtSize="standard" style={{ marginLeft: 10 }} />
        </View>
        <View
          style={{
            marginHorizontal: 10,
            marginBottom: 20,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text text="Near Job" txtSize="standard" style={{ marginRight: 10 }} />
          <Switch value={isSwitchOn} onValueChange={setIsSwitchOn} size="large" />
          <Text text="All" txtSize="standard" style={{ marginLeft: 10 }} />
        </View>
        <View
          style={{
            marginHorizontal: 10,
            marginBottom: 20,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text text="Near Job" txtSize="standard" style={{ marginRight: 10 }} />
          <Switch value={isSwitchOn} onValueChange={setIsSwitchOn} isOffOnToggle={true} size="medium" />
          <Text text="All" txtSize="standard" style={{ marginLeft: 10 }} />
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
                  <Text>Category: {item.CategoryName}</Text>
                  <Text>Item: {item.ItemName}</Text>
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
