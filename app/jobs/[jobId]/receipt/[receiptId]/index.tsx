import { ReceiptSummary } from '@/components/ReceiptSummary';
import { TextField } from '@/components/TextField';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ActionButton } from '@/components/ActionButton';

const ReceiptDetailsPage = () => {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { allJobReceipts } = useReceiptDataStore();
  const { jobDbHost } = useJobDb();
  const [receipt, setReceipt] = useState<ReceiptBucketData>({
    _id: '',
    UserId: '',
    JobId: '',
    DeviceId: '',
    Amount: 0,
    Vendor: '',
    Description: '',
    Notes: '',
    CategoryId: '',
    ItemId: '',
    AssetId: '',
    AlbumId: '',
    PictureUri: '',
  });

  const fetchReceipt = useCallback(async () => {
    try {
      const match = allJobReceipts.find((r) => r._id === receiptId);
      if (!match) return;

      if (match) {
        setReceipt((prevReceipt) => ({
          ...prevReceipt,
          ...match,
        }));
      }
    } catch (err) {
      alert(`An error occurred while fetching the receipt with _id=${receiptId}`);
      console.log('An error occurred while fetching the receipt', err);
    }
  }, [receiptId, jobDbHost, allJobReceipts]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const showPicture = useCallback(
    (uri: string) => {
      router.push(`/jobs/${receipt.JobId}/receipt/${receiptId}/showImage/?uri=${uri}`);
    },
    [receipt, receiptId],
  );

  const editDetails = useCallback(
    (item: ReceiptBucketData) => {
      router.push(`/jobs/${receipt.JobId}/receipt/${receiptId}/edit`);
    },
    [receipt, receiptId],
  );

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            separatorColor: Colors.dark.separatorColor,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            shadowColor: Colors.dark.shadowColor,
            boxShadow: Colors.dark.boxShadow,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            separatorColor: Colors.light.separatorColor,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            shadowColor: Colors.light.shadowColor,
            boxShadow: Colors.light.boxShadow,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  const boxShadow = Platform.OS === 'web' ? colors.boxShadow : undefined;

  const addLineItem = useCallback(() => {}, []);
  const requestAIProcessing = useCallback(() => {}, []);
  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView
      onLayout={onLayout}
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: 'yellow', overflowY: 'hidden' }}
    >
      <Stack.Screen options={{ title: 'Receipt Details', headerShown: true }} />
      {containerHeight > 0 && (
        <>
          <View
            style={[
              styles.itemContainer,
              { backgroundColor: colors.itemBackground },
              { backgroundColor: colors.itemBackground, shadowColor: colors.shadowColor, boxShadow },
            ]}
          >
            <ReceiptSummary item={receipt} onShowDetails={editDetails} onShowPicture={showPicture} />
          </View>

          <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <ActionButton
                style={styles.leftButton}
                onPress={addLineItem}
                type={'action'}
                title="Add Line Item"
              />
              <ActionButton
                style={styles.rightButton}
                onPress={requestAIProcessing}
                type={'action'}
                title="Load from Photo"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                height: 40,
                alignItems: 'center',
                borderBottomColor: colors.separatorColor,
                borderBottomWidth: 2,
              }}
            >
              <Text
                style={{ width: 105, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="Amount"
              />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="Description"
              />
              <Text style={{ width: 40, fontWeight: '600' }} txtSize="standard" text="" />
            </View>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                borderTopColor: colors.separatorColor,
                borderTopWidth: 1,

                minHeight: 40,
                alignItems: 'center',
              }}
            >
              <Text style={{ width: 105, textAlign: 'right' }} txtSize="standard" text="10,223.00" />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'left' }}
                txtSize="standard"
                text="Nails"
              />
              <View
                style={{
                  width: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <AntDesign name="questioncircleo" size={24} color={colors.iconColor} />
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderTopColor: colors.separatorColor,
                borderTopWidth: 1,
                width: '100%',
                minHeight: 40,
                alignItems: 'center',
              }}
            >
              <Text style={{ width: 105, textAlign: 'right' }} txtSize="standard" text="10,223.00" />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'left' }}
                txtSize="standard"
                text="This is a very long description of the items purchased"
              />
              <View
                style={{
                  width: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <AntDesign name="checkcircleo" size={24} color={colors.iconColor} />
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                height: 40,
                alignItems: 'center',
                borderTopColor: colors.separatorColor,
                borderTopWidth: 2,
              }}
            >
              <Text
                style={{ width: 105, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="20,446.00"
              />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="Total for 2 line items"
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default ReceiptDetailsPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    flex: 1,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
  itemContainer: {
    flexDirection: 'row',
    margin: 20,
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    padding: 10,
    height: 100,
  },

  leftButton: {
    marginRight: 5,
    flex: 1,
  },
  rightButton: {
    flex: 1,
    marginLeft: 5,
  },
});
