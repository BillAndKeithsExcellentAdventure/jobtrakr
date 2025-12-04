import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import {
  WorkItemDataCodeCompareAsNumber,
  useAllRows as useAllConfigurationRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAddRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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

  /*
  const handleNotesChange = useCallback((notes: string) => {
    setProjectReceipt((prevReceipt) => ({
      ...prevReceipt,
      notes,
    }));
  }, []);
  */

  const handleAddReceipt = useCallback(async () => {
    if (!canAddReceipt) return;

    const receiptToAdd = {
      ...projectReceipt,
      markedComplete: applyToSingleCostCode && !!pickedSubCategoryOption,
    };
    const result = addReceipt(receiptToAdd);
    if (result.status !== 'Success') {
      console.log('Add Project receipt failed:', receiptToAdd);
    } else {
      if (applyToSingleCostCode && !!pickedSubCategoryOption) {
        const newLineItem: WorkItemCostEntry = {
          id: '',
          label: projectReceipt.description,
          workItemId: pickedSubCategoryOption.value,
          amount: projectReceipt.amount,
          parentId: result.id,
          documentationType: 'receipt',
        };
        const addLineItemResult = addLineItem(newLineItem);
        if (addLineItemResult.status !== 'Success') {
          Alert.alert('Error', 'Unable to add line item for receipt.');
          console.log('Error adding line item for receipt:', addLineItemResult);
        }
      }
    }
    console.log('Project receipt successfully added:', projectReceipt);
    router.back();
  }, [projectReceipt, canAddReceipt]);

  const handleCaptureImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("You've refused to allow this app to access your camera!");
      return;
    }

    const response = await ImagePicker.launchCameraAsync({
      quality: 1,
      aspect: [2, 3],
      allowsEditing: true,
    });

    if (!response.canceled) {
      const asset = response.assets[0];
      if (!response.assets || response.assets.length === 0 || !asset) return;

      const imageAddResult = await addPhotoImage(asset.uri, projectId, 'photo', 'photo');
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

  const [applyToSingleCostCode, setApplyToSingleCostCode] = useState(false);
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const { projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions } =
    useProjectWorkItems(projectId);

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setPickedSubCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([]);
  const handleSubCategoryChange = useCallback((selectedSubCategory: OptionEntry) => {
    setPickedSubCategoryOption(selectedSubCategory);
  }, []);

  const handleCategoryChange = useCallback(
    (selectedCategory: OptionEntry) => {
      setPickedCategoryOption(selectedCategory);
      if (selectedCategory) {
        const workItems = projectWorkItems
          .filter((item) => item.categoryId === selectedCategory.value)
          .sort(WorkItemDataCodeCompareAsNumber);
        const subCategories = workItems.map((item) => {
          return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
        });

        setSubCategories(subCategories);
        setPickedSubCategoryOption(undefined);
      }
    },
    [projectWorkItems, allAvailableCostItemOptions],
  );

  useEffect(() => {
    if (applyToSingleCostCode && !pickedSubCategoryOption) {
      setCanAddReceipt(false);
    } else {
      setCanAddReceipt(
        (projectReceipt.amount > 0 && !!projectReceipt.vendor && !!projectReceipt.description) ||
          !!projectReceipt.imageId,
      );
    }
  }, [projectReceipt, applyToSingleCostCode, pickedSubCategoryOption]);

  useEffect(() => {
    if (pickedCategoryOption === undefined || pickedCategoryOption.value === '') {
      setSubCategories(allAvailableCostItemOptions);
    }
  }, [pickedCategoryOption, allAvailableCostItemOptions]);

  const handleSubCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleSubCategoryChange(option);
    }
    setIsSubCategoryPickerVisible(false);
  };

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
  };

  const handleCancel = useCallback(() => {
    // clear state of receipt data
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
  }, [router, defaultDate]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleAddReceipt} onCancel={handleCancel} canSave={canAddReceipt}>
        <Text txtSize="standard" style={[styles.modalTitle, { fontWeight: '600' }]} text={projectName} />
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
          {/*----------- Hide until we find a need to specify a note
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Notes"
                label="Notes"
                value={projectReceipt.notes}
                onChangeText={handleNotesChange}
              />
              -------- */}
          {projectReceipt.thumbnail && (
            <>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  style={{ width: 80, height: 120, marginVertical: 10 }}
                  source={{ uri: `data:image/png;base64,${projectReceipt.thumbnail}` }}
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

          <View style={styles.applyToSingleCostCodeRow}>
            <Switch value={applyToSingleCostCode} onValueChange={setApplyToSingleCostCode} size="large" />
            <Text text="Apply to Single Cost Code" txtSize="standard" style={{ marginLeft: 10 }} />
          </View>

          {applyToSingleCostCode && (
            <>
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={pickedCategoryOption?.label}
                label="Category"
                placeholder="Category"
                editable={false}
                onPickerButtonPress={() => setIsCategoryPickerVisible(true)}
              />
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={pickedSubCategoryOption?.label}
                label="Cost Item Type"
                placeholder="Cost Item Type"
                editable={false}
                onPickerButtonPress={() => setIsSubCategoryPickerVisible(true)}
              />
            </>
          )}
        </View>
      </ModalScreenContainer>
      {vendors && isVendorListPickerVisible && (
        <BottomSheetContainer
          isVisible={isVendorListPickerVisible}
          onClose={() => setIsVendorListPickerVisible(false)}
        >
          <OptionList
            options={vendors}
            onSelect={(option) => handleVendorOptionChange(option)}
            selectedOption={pickedOption}
            enableSearch={vendors.length > 15}
          />
        </BottomSheetContainer>
      )}
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          isVisible={isCategoryPickerVisible}
          onClose={() => setIsCategoryPickerVisible(false)}
        >
          <OptionList
            options={availableCategoriesOptions}
            onSelect={(option) => handleCategoryOptionChange(option)}
            selectedOption={pickedCategoryOption}
            enableSearch={availableCategoriesOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
      {isSubCategoryPickerVisible && (
        <BottomSheetContainer
          isVisible={isSubCategoryPickerVisible}
          onClose={() => setIsSubCategoryPickerVisible(false)}
        >
          <OptionList
            centerOptions={false}
            boldSelectedOption={false}
            options={subCategories}
            onSelect={(option) => handleSubCategoryOptionChange(option)}
            selectedOption={pickedSubCategoryOption}
            enableSearch={subCategories.length > 15}
          />
        </BottomSheetContainer>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  applyToSingleCostCodeRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
});

export default AddReceiptPage;
