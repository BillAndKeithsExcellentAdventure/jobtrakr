import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';
import { ActionButton } from '@/components/ActionButton';
import { ActionButtonProps, ButtonBar } from '@/components/ButtonBar';
import { ModalImageViewer } from '@/components/ModalImageViewer';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { formatCurrency } from '@/utils/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet } from 'react-native';

function isReceiptEntry(actionContext: any): actionContext is { PictureUri: string } {
  return actionContext && typeof actionContext.PictureUri === 'string';
}

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

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.dark.iconColor,
            separatorColor: Colors.dark.separatorColor,
          }
        : {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.light.iconColor,
            separatorColor: Colors.light.separatorColor,
          },
    [colorScheme],
  );

  const onEditPressed = useCallback((entryId: string) => {}, []);

  const buttons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="edit" size={24} color={colors.iconColor} />,
        label: 'Edit',
        onPress: (e, actionContext) => {
          if (isReceiptEntry(actionContext)) {
            if (actionContext && actionContext.entryId) onEditPressed(actionContext.entryId);
          }
        },
      },
      {
        icon: <FontAwesome name="trash" size={24} color={colors.deleteColor} />,
        label: 'Delete',
        onPress: (e, actionContext) => {
          if (isReceiptEntry(actionContext)) {
            if (actionContext && actionContext.entryId) handleRemoveReceipt(actionContext.entryId);
          }
        },
      },
    ],
    [colors, onEditPressed, handleRemoveReceipt],
  );

  const ListHeader: React.FC = () => (
    <View style={styles.listHeaderContainer}>
      <Text txtSize="sub-title">Amount</Text>
      <Text txtSize="sub-title">Description</Text>
      <Text txtSize="sub-title">Vendor</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={{ padding: 20, flex: 1 }}>
        <View style={{ marginHorizontal: 10, marginBottom: 20 }}>
          <ActionButton onPress={handleAddReceipt} type={'action'} title="Add Receipt" />
        </View>

        <Text text="Job Receipts" txtSize="title" />
        <View style={{ flex: 1, width: '100%' }}>
          {receipts.length === 0 ? (
            <View style={{ alignItems: 'center' }}>
              <Text>No receipts found.</Text>
            </View>
          ) : (
            <FlashList
              estimatedItemSize={200}
              data={receipts}
              keyExtractor={(item, index) => item._id ?? index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 10,
                    paddingTop: 5,
                    borderWidth: 1,
                    borderRadius: 10,
                    width: '100%',
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <View style={styles.imageContentContainer}>
                      {item.PictureUri ? (
                        <Pressable onPress={() => showPicture(item.PictureUri!)}>
                          <Image source={{ uri: item.PictureUri }} style={{ height: 80, width: 120 }} />
                        </Pressable>
                      ) : (
                        <Text>Add Image</Text>
                      )}
                    </View>
                    <View>
                      <Text>Amount: {formatCurrency(item.Amount)}</Text>
                      <Text>Vendor: {item.Vendor}</Text>
                      <Text>Description: {item.Description}</Text>
                      <Text>Notes: {item.Notes}</Text>
                    </View>
                  </View>
                  <View
                    style={{
                      alignItems: 'stretch',
                    }}
                  >
                    {buttons && <ButtonBar buttons={buttons} actionContext={item} />}
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
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  imageContentContainer: {
    marginRight: 5,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default JobReceiptsPage;
