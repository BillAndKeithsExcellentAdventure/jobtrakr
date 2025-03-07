import { ActionButton } from '@/components/ActionButton';
import { NumberInputField } from '@/components/NumberInputField';
import { TextField } from '@/components/TextField';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { formatDate } from '@/utils/formatters';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddReceiptPage = () => {
  const defaultDate = new Date();
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();

  type JobReceipt = {
    date: Date;
    jobId: string;
    amount: number;
    vendor: string;
    description: string;
    notes: string;
    categoryName: string;
    subCategoryName: string;
    pictureUri?: string;
    albumId?: string;
    assetId?: string;
  };

  const initJobReceipt: JobReceipt = {
    jobId,
    date: defaultDate,
    amount: 0,
    vendor: '',
    description: '',
    notes: '',
    categoryName: '',
    subCategoryName: '',
  };

  const [jobReceipt, setJobReceipt] = useState<JobReceipt>(initJobReceipt);
  const { jobDbHost } = useJobDb();
  const { addReceiptData } = useReceiptDataStore();
  const colorScheme = useColorScheme();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [canAddReceipt, setCanAddReceipt] = useState(false);

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            neutral200: Colors.dark.neutral200,
            transparent: Colors.dark.transparent,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            neutral200: Colors.light.neutral200,
            transparent: Colors.light.transparent,
          },
    [colorScheme],
  );

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = useCallback((date: Date) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      date,
    }));

    hideDatePicker();
  }, []);

  const handleAmountChange = useCallback((amount: number) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      amount,
    }));
  }, []);

  const handleVendorChange = useCallback((vendor: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      vendor,
    }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      description,
    }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      notes,
    }));
  }, []);

  const handleCategoryChange = useCallback((categoryName: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      categoryName,
    }));
  }, []);

  const handleSubCategoryChange = useCallback((subCategoryName: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      subCategoryName,
    }));
  }, []);

  useEffect(() => {
    setCanAddReceipt(
      (jobReceipt.amount > 0 && !!jobReceipt.vendor && !!jobReceipt.description) || !!jobReceipt.pictureUri,
    );
  }, [jobReceipt]);

  const handleAddReceipt = useCallback(async () => {
    if (!canAddReceipt) return;

    const newReceipt: ReceiptBucketData = {
      Amount: jobReceipt.amount,
      Vendor: jobReceipt.vendor,
      Description: jobReceipt.description,
      Notes: jobReceipt.notes,
      AssetId: jobReceipt.assetId,
      PictureUri: jobReceipt.pictureUri,
    };

    const response = await jobDbHost?.GetReceiptBucketDB().InsertReceipt(jobId, newReceipt);
    if (response?.status === 'Success') {
      newReceipt._id = response.id;
      newReceipt.JobId = jobId;
      addReceiptData(newReceipt);
      console.log('Job receipt successfully added:', newReceipt);
    } else {
      console.log('Job receipt update failed:', jobReceipt);
    }
    router.back();
  }, [jobReceipt, jobDbHost, addReceiptData, canAddReceipt]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleCaptureImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const response = await ImagePicker.launchCameraAsync();

    if (!response.canceled) {
      const asset = response.assets[0];
      if (!response.assets || response.assets.length === 0 || !asset) return;
      setJobReceipt((prevReceipt) => ({
        ...prevReceipt,
        pictureUri: asset.uri,
        assetId: asset.assetId ?? undefined,
      }));
    }
  }, []);

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Add Receipt', headerShown: false }} />
      <View
        style={[
          styles.container,
          styles.modalBackground,
          { backgroundColor: colors.modalOverlayBackgroundColor },
        ]}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={[styles.modalContainer, { marginTop: 30 }]}>
            <Text txtSize="sub-title" style={styles.modalTitle} text={jobName} />
            <Text txtSize="title" style={styles.modalTitle} text="Add Receipt" />

            <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.borderColor }}>
              <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
                <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Date"
                  onPressIn={showDatePicker}
                  value={jobReceipt.date ? formatDate(jobReceipt.date) : 'No date selected'}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={jobReceipt.date}
                isVisible={datePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
              />

              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Vendor"
                label="Vendor"
                value={jobReceipt.vendor}
                onChangeText={handleVendorChange}
              />

              <NumberInputField
                style={styles.inputContainer}
                placeholder="Amount"
                label="Amount"
                value={jobReceipt.amount}
                onChange={handleAmountChange}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Description"
                label="Description"
                value={jobReceipt.description}
                onChangeText={handleDescriptionChange}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Notes"
                label="Notes"
                value={jobReceipt.notes}
                onChangeText={handleNotesChange}
              />

              {jobReceipt.pictureUri && (
                <>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={{ uri: jobReceipt.pictureUri }}
                      style={{ width: 275, height: 180, marginVertical: 10 }}
                    />
                  </View>
                </>
              )}

              <View style={styles.takePictureButtonRow}>
                <ActionButton
                  style={styles.saveButton}
                  onPress={handleCaptureImage}
                  type={'action'}
                  title={jobReceipt.pictureUri ? 'Retake Picture' : 'Take Picture'}
                />
              </View>
            </View>

            <View style={styles.saveButtonRow}>
              <ActionButton
                style={styles.saveButton}
                onPress={handleAddReceipt}
                type={canAddReceipt ? 'ok' : 'disabled'}
                title="Save"
              />

              <ActionButton
                style={styles.cancelButton}
                onPress={() => {
                  setJobReceipt(initJobReceipt);
                  router.back();
                }}
                type={'cancel'}
                title="Cancel"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
  },
  modalContainer: {
    maxWidth: 550,
    width: '90%',
    padding: 10,
    borderRadius: 20,
  },
  modalTitle: {
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 6,
  },
  inputLabel: {
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
  },
  dateInput: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 40,
    paddingVertical: 0,
  },
  takePictureButtonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default AddReceiptPage;
