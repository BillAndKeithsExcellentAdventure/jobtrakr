import { TextField } from '@/components/TextField';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { addButtonBg, cancelButtonBg, Colors, saveButtonBg } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { formatDate } from '@/utils/formatters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Button as RNButton,
  SafeAreaView,
  Button,
  Image,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { launchCamera } from 'react-native-image-picker';

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
};

const AddReceiptModalScreen = ({
  jobId,
  visible,
  hideModal,
}: {
  jobId: string;
  visible: boolean;
  hideModal: (success: boolean) => void;
}) => {
  const defaultDate = new Date();

  const [jobReceipt, setJobReceipt] = useState<JobReceipt>({
    jobId,
    date: defaultDate,
    amount: 0,
    vendor: '',
    description: '',
    notes: '',
    categoryName: '',
    subCategoryName: '',
  });

  const colorScheme = useColorScheme();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [canAddReceipt, setCanAddReceipt] = useState(false);
  const { jobDbHost } = useJobDb();

  const colors = useMemo<any>(() => {
    const themeColors =
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral500: Colors.dark.neutral500,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
            tint: Colors.dark.tint,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral500: Colors.light.neutral500,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
            tint: Colors.light.tint,
          };

    return themeColors;
  }, [colorScheme]);

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

  const handleAmountChange = useCallback((amount: string) => {
    setJobReceipt((prevReceipt) => ({
      ...prevReceipt,
      amount: parseFloat(amount),
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
    setCanAddReceipt(jobReceipt.amount > 0 && !!jobReceipt.vendor && !!jobReceipt.description);
  }, [jobReceipt]);

  const handleAddReceipt = useCallback(async () => {
    if (!canAddReceipt) return;

    /*
    const modifiedJobReceipt: JobReceiptData = {
      Amount: jobReceipt.amount,
      Vendor: jobReceipt.vendor,
      Description: jobReceipt.description,
      Notes: jobReceipt.notes,
      CategoryName: jobReceipt.categoryName,
      ItemName: jobReceipt.subCategoryName,
    };

    const status = await jobDbHost?.GetJobDB().UpdateJobReceipt(modifiedJobReceipt);
    if (status === 'Success') {
      console.log('Job receipt successfully updated:', jobReceipt);
      hideModal(true);
    } else {
      console.log('Job receipt update failed:', jobReceipt);
      hideModal(false);
    }
      */
    hideModal(false);
  }, [jobReceipt]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleCaptureImage = useCallback(() => {
    launchCamera(
      {
        mediaType: 'photo',
        saveToPhotos: true,
        cameraType: 'back',
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else {
          if (!response.assets || response.assets.length === 0 || !response.assets[0].uri) return;
          setJobReceipt((prevReceipt) => ({
            ...prevReceipt,
            pictureUri: response.assets ? response.assets[0].uri : '',
          }));
        }
      },
    );
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            styles.container,
            styles.modalBackground,
            { backgroundColor: colors.modalOverlayBackgroundColor },
          ]}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Receipt</Text>

            <View style={{ paddingBottom: 20, borderBottomWidth: 1 }}>
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

              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Amount"
                label="Amount"
                keyboardType="numeric"
                value={jobReceipt.amount?.toString()}
                onChangeText={handleAmountChange}
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
            </View>

            {jobReceipt.pictureUri && (
              <>
                <Text>Picture selected: {jobReceipt.pictureUri}</Text>
                <View style={{ marginBottom: 20 }}>
                  <Text>Picture selected:</Text>
                  <Image
                    source={{ uri: jobReceipt.pictureUri }}
                    style={{ width: 150, height: 150, marginVertical: 10 }}
                  />
                </View>
              </>
            )}

            <View style={styles.saveButtonRow}>
              <TouchableOpacity
                onPress={handleCaptureImage}
                style={[styles.saveButton, { backgroundColor: addButtonBg }]}
              >
                <Text style={styles.saveButtonText}>Take Picture</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.saveButtonRow}>
              <TouchableOpacity
                onPress={handleAddReceipt}
                disabled={!canAddReceipt}
                style={[
                  styles.saveButton,
                  { backgroundColor: !!canAddReceipt ? saveButtonBg : colors.neutral500 },
                ]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => hideModal(false)}
                style={[styles.cancelButton, { backgroundColor: cancelButtonBg }]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingTop: 10,
  },
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    maxWidth: 400,
    width: '90%',
    padding: 10,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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

  dateButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
  },
  gpsButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  gpsButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10, // Rounded edges
  },
  gpsButtonLeft: {
    marginRight: 10, // Add margin between the two buttons
  },
  gpsButtonRight: {
    marginLeft: 10, // Add margin between the two buttons
  },
  gpsButtonText: {
    fontSize: 16,
    fontWeight: 'semibold',
  },
  saveButtonRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default AddReceiptModalScreen;
