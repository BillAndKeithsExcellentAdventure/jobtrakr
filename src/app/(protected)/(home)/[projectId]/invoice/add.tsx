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
  InvoiceData,
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

const AddInvoicePage = () => {
  const defaultDate = new Date();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const addInvoice = useAddRowCallback(projectId, 'invoices');
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
  const [projectInvoice, setProjectInvoice] = useState<InvoiceData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    invoiceDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
    invoiceNumber: '',
  });

  const handleVendorChange = useCallback((vendor: string) => {
    setProjectInvoice((prevReceipt) => ({
      ...prevReceipt,
      vendor,
    }));
  }, []);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [canAddInvoice, setCanAddInvoice] = useState(false);
  const addPhotoImage = useAddImageCallback();
  const allVendors = useAllConfigurationRows('vendors');

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
    setProjectInvoice((prevInvoice) => ({
      ...prevInvoice,
      date,
    }));

    hideDatePicker();
  }, []);

  const handleAddInvoice = useCallback(async () => {
    if (!canAddInvoice) return;

    const invoiceToAdd = {
      ...projectInvoice,
      markedComplete: applyToSingleCostCode && !!pickedSubCategoryOption,
    };
    const result = addInvoice(invoiceToAdd);
    if (result.status !== 'Success') {
      console.log('Add Project invoice failed:', invoiceToAdd);
    } else {
      if (applyToSingleCostCode && !!pickedSubCategoryOption) {
        const newLineItem: WorkItemCostEntry = {
          id: '',
          label: projectInvoice.description,
          workItemId: pickedSubCategoryOption.value,
          amount: projectInvoice.amount,
          parentId: result.id,
          documentationType: 'invoice',
        };
        const addLineItemResult = addLineItem(newLineItem);
        if (addLineItemResult.status !== 'Success') {
          Alert.alert('Error', 'Unable to add line item for invoice.');
          console.log('Error adding line item for invoice:', addLineItemResult);
        }
      }
    }
    console.log('Project invoice successfully added:', projectInvoice);
    router.back();
  }, [projectInvoice, canAddInvoice]);

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

        setProjectInvoice((prevInvoice) => ({
          ...prevInvoice,
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
      setCanAddInvoice(false);
    } else {
      setCanAddInvoice(
        (projectInvoice.amount > 0 && !!projectInvoice.vendor && !!projectInvoice.description) ||
          !!projectInvoice.imageId,
      );
    }
  }, [projectInvoice, applyToSingleCostCode, pickedSubCategoryOption]);

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
    // clear state of invoice data
    setProjectInvoice({
      id: '',
      vendor: '',
      description: '',
      amount: 0,
      numLineItems: 0,
      invoiceDate: defaultDate.getTime(),
      thumbnail: '',
      pictureDate: 0,
      imageId: '',
      notes: '',
      markedComplete: false,
      invoiceNumber: '',
    });
    router.back();
  }, [router, defaultDate]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleAddInvoice} onCancel={handleCancel} canSave={canAddInvoice}>
        <Text txtSize="standard" style={[styles.modalTitle, { fontWeight: '600' }]} text={projectName} />
        <Text txtSize="title" style={styles.modalTitle} text="Add Invoice" />

        <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.border }}>
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Invoice Number"
            label="Invoice Number"
            value={projectInvoice.invoiceNumber}
            onChangeText={(invoiceNumber) =>
              setProjectInvoice((prevInvoice) => ({
                ...prevInvoice,
                invoiceNumber,
              }))
            }
          />

          <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
            <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
            <TextInput
              readOnly={true}
              style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
              placeholder="Date"
              onPressIn={showDatePicker}
              value={formatDate(projectInvoice.invoiceDate)}
            />
          </TouchableOpacity>
          <DateTimePickerModal
            style={{ alignSelf: 'stretch' }}
            date={projectInvoice.invoiceDate ? new Date(projectInvoice.invoiceDate) : defaultDate}
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={hideDatePicker}
          />

          {vendors && vendors.length ? (
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={projectInvoice.vendor}
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
              value={projectInvoice.vendor}
              onChangeText={handleVendorChange}
            />
          )}

          <NumberInputField
            style={styles.inputContainer}
            placeholder="Amount"
            label="Amount"
            value={projectInvoice.amount}
            onChange={(amount: number) =>
              setProjectInvoice((prevInvoice) => ({
                ...prevInvoice,
                amount,
              }))
            }
          />
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Description"
            label="Description"
            value={projectInvoice.description}
            onChangeText={(description) =>
              setProjectInvoice((prevInvoice) => ({
                ...prevInvoice,
                description,
              }))
            }
          />
          {projectInvoice.thumbnail && (
            <>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  style={{ width: 80, height: 120, marginVertical: 10 }}
                  source={{ uri: `data:image/png;base64,${projectInvoice.thumbnail}` }}
                />
              </View>
            </>
          )}

          <View style={styles.takePictureButtonRow}>
            <ActionButton
              style={styles.saveButton}
              onPress={handleCaptureImage}
              type={'action'}
              title={projectInvoice.imageId ? 'Retake Picture' : 'Take Picture'}
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

export default AddInvoicePage;
