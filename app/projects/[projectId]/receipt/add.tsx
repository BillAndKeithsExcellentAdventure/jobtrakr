import { ActionButton } from '@/components/ActionButton';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { NumberInputField } from '@/components/NumberInputField';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import { TextField } from '@/components/TextField';
import { Text, TextInput, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import { useAllRows as useAllConfigurationRows } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { ReceiptData, useAddRowCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/utils/formatters';
import { useAddImageCallback } from '@/utils/images';
import { createThumbnail } from '@/utils/thumbnailUtils';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddReceiptPage = () => {
  const defaultDate = new Date();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const addReceipt = useAddRowCallback(projectId, 'receipts');
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);

  const handleVendorOptionChange = (option: OptionEntry) => {
    setPickedOption(option);
    if (option) {
      handleVendorChange(option.label);
    }
    setIsVendorListPickerVisible(false);
  };

  const router = useRouter();
  const [projectReceipt, setProjectReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    receiptDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [canAddReceipt, setCanAddReceipt] = useState(false);
  const allVendors = useAllConfigurationRows('vendors');
  const addPhotoImage = useAddImageCallback();

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: `${vendor.name} ${
          vendor.address ? ` - ${vendor.address}` : vendor.city ? ` - ${vendor.city}` : ''
        }`,
        value: vendor.id,
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  const colors = useColors();

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = useCallback((date: Date) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      date,
    }));

    hideDatePicker();
  }, []);

  const handleAmountChange = useCallback((amount: number) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      amount,
    }));
  }, []);

  const handleVendorChange = useCallback((vendor: string) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      vendor,
    }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      description,
    }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      notes,
    }));
  }, []);

  useEffect(() => {
    setCanAddReceipt(
      (projectReceipt.amount > 0 && !!projectReceipt.vendor && !!projectReceipt.description) ||
        !!projectReceipt.imageId,
    );
  }, [projectReceipt]);

  const handleAddReceipt = useCallback(async () => {
    if (!canAddReceipt) return;

    const result = addReceipt(projectReceipt);

    if (result.status !== 'Success') {
      console.log('Add Project receipt failed:', projectReceipt);
    }
    router.back();
  }, [projectReceipt, canAddReceipt]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleCaptureImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("You've refused to allow this app to access your camera!");
      return;
    }

    const response = await ImagePicker.launchCameraAsync();

    if (!response.canceled) {
      const asset = response.assets[0];
      if (!response.assets || response.assets.length === 0 || !asset) return;

      const imageAddResult = await addPhotoImage(asset.uri, projectId, 'photo');
      console.log('Image Add Result:', imageAddResult);
      if (imageAddResult.status === 'Success' && imageAddResult.uri) {
        const thumbnail = await createThumbnail(asset.uri);

        setProjectReceipt((prevReceipt) => ({
          ...prevReceipt,
          thumbnail: thumbnail ?? '',
          imageId: imageAddResult.id,
          assetId: asset.assetId ?? undefined,
        }));
      }
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
            <Text txtSize="sub-title" style={styles.modalTitle} text={projectName} />
            <Text txtSize="title" style={styles.modalTitle} text="Add Receipt" />

            <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
                <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Date"
                  onPressIn={showDatePicker}
                  value={formatDate(projectReceipt.receiptDate)}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={projectReceipt.receiptDate ? new Date(projectReceipt.receiptDate) : defaultDate}
                isVisible={datePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
              />

              {vendors && vendors.length ? (
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={projectReceipt.vendor}
                  label="Vendor"
                  placeholder="Vendor"
                  onOptionLabelChange={handleVendorChange}
                  onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                />
              ) : (
                <TextField
                  containerStyle={styles.inputContainer}
                  style={[styles.input, { borderColor: colors.transparent }]}
                  placeholder="Vendor"
                  label="Vendor"
                  value={projectReceipt.vendor}
                  onChangeText={handleVendorChange}
                />
              )}

              <NumberInputField
                style={styles.inputContainer}
                placeholder="Amount"
                label="Amount"
                value={projectReceipt.amount}
                onChange={handleAmountChange}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Description"
                label="Description"
                value={projectReceipt.description}
                onChangeText={handleDescriptionChange}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Notes"
                label="Notes"
                value={projectReceipt.notes}
                onChangeText={handleNotesChange}
              />

              {projectReceipt.pictureUri && (
                <>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={{ uri: projectReceipt.pictureUri }}
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
                  title={projectReceipt.imageId ? 'Retake Picture' : 'Take Picture'}
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
                  setProjectReceipt({
                    id: '',
                    vendor: '',
                    description: '',
                    amount: 0,
                    numLineItems: 0,
                    receiptDate: defaultDate.getTime(),
                    thumbnail: '',
                    pictureDate: 0,
                    imageId: '',
                    notes: '',
                    markedComplete: false,
                  });
                  router.back();
                }}
                type={'cancel'}
                title="Cancel"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
        {vendors && isVendorListPickerVisible && (
          <BottomSheetContainer
            isVisible={isVendorListPickerVisible}
            onClose={() => setIsVendorListPickerVisible(false)}
          >
            <OptionList
              options={vendors}
              onSelect={(option) => handleVendorOptionChange(option)}
              selectedOption={pickedOption}
            />
          </BottomSheetContainer>
        )}
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
