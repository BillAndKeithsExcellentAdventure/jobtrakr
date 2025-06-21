import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows as useAllConfigurationRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  InvoiceData,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddInvoicePage = () => {
  const defaultDate = new Date();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const addInvoice = useAddRowCallback(projectId, 'invoices');
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedVendorOption, setPickedVendorOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);
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

  const handleVendorOptionChange = (option: OptionEntry) => {
    setPickedVendorOption(option);
    if (option) {
      handleVendorChange(option.label);
    }
    setIsVendorListPickerVisible(false);
  };

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
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const allWorkItems = useAllConfigurationRows('workItems');
  const allWorkCategories = useAllConfigurationRows('categories', WorkCategoryCodeCompareAsNumber);

  const availableCategoriesOptions: OptionEntry[] = useMemo(() => {
    // get a list of all unique workitemids from allWorkItemCostSummaries available in the project
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);

    // now get list of all unique categoryIds from allWorkItems given list of uniqueWorkItemIds
    const uniqueCategoryIds = allWorkItems
      .filter((item) => uniqueWorkItemIds.includes(item.id))
      .map((item) => item.categoryId);

    // now get an array of OptionEntry for each entry in uniqueCategoryIds using allWorkCategories
    const uniqueCategories = allWorkCategories
      .filter((item) => uniqueCategoryIds.includes(item.id))
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));
    return uniqueCategories;
  }, [allWorkItemCostSummaries, allWorkItems, allWorkCategories]);

  const allAvailableCostItemOptions: OptionEntry[] = useMemo(() => {
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);
    const uniqueWorkItems = allWorkItems.filter((item) => uniqueWorkItemIds.includes(item.id));
    const uniqueCostItems = uniqueWorkItems.map((item) => {
      const category = allWorkCategories.find((o) => o.id === item.categoryId);
      const categoryCode = category ? `${category.code}.` : '';
      return {
        label: `${categoryCode}${item.code} - ${item.name}`,
        value: item.id,
      };
    });
    return uniqueCostItems;
  }, [allWorkItemCostSummaries, allWorkItems]);

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
        const workItems = allWorkItems
          .filter((item) => item.categoryId === selectedCategory.value)
          .sort(WorkItemDataCodeCompareAsNumber);
        const subCategories = workItems.map((item) => {
          return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
        });

        setSubCategories(subCategories);
        setPickedSubCategoryOption(undefined);
      }
    },
    [availableCategoriesOptions, allWorkItems],
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

  return (
    <>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Add Invoice', headerShown: false }} />
        <View
          style={[
            styles.container,
            styles.modalBackground,
            { backgroundColor: colors.modalOverlayBackgroundColor, paddingHorizontal: 10 },
          ]}
        >
          <View style={[styles.modalContainer, { marginTop: 10 }]}>
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
                  onOptionLabelChange={(vendor: string) =>
                    setProjectInvoice((prevInvoice) => ({
                      ...prevInvoice,
                      vendor,
                    }))
                  }
                  onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                />
              ) : (
                <TextField
                  containerStyle={styles.inputContainer}
                  style={[styles.input, { borderColor: colors.transparent }]}
                  placeholder="Vendor"
                  label="Vendor"
                  value={projectInvoice.vendor}
                  onChangeText={(vendor: string) =>
                    setProjectInvoice((prevInvoice) => ({
                      ...prevInvoice,
                      vendor,
                    }))
                  }
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

            <View style={styles.saveButtonRow}>
              <ActionButton
                style={styles.saveButton}
                onPress={handleAddInvoice}
                type={canAddInvoice ? 'ok' : 'disabled'}
                title="Save"
              />

              <ActionButton
                style={styles.cancelButton}
                onPress={() => {
                  // clear state of invoice dat;
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
                }}
                type={'cancel'}
                title="Cancel"
              />
            </View>
          </View>
          {vendors && isVendorListPickerVisible && (
            <BottomSheetContainer
              isVisible={isVendorListPickerVisible}
              onClose={() => setIsVendorListPickerVisible(false)}
            >
              <OptionList
                options={vendors}
                onSelect={(option) => handleVendorOptionChange(option)}
                selectedOption={pickedVendorOption}
              />
            </BottomSheetContainer>
          )}
        </View>
        {isCategoryPickerVisible && (
          <BottomSheetContainer
            isVisible={isCategoryPickerVisible}
            onClose={() => setIsCategoryPickerVisible(false)}
          >
            <OptionList
              options={availableCategoriesOptions}
              onSelect={(option) => handleCategoryOptionChange(option)}
              selectedOption={pickedCategoryOption}
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
            />
          </BottomSheetContainer>
        )}
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
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
    width: '100%',
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
  applyToSingleCostCodeRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
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

export default AddInvoicePage;
