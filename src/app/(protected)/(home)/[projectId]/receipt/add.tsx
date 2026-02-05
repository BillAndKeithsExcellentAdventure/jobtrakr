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
import { useNetwork } from '@/src/context/NetworkContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  useAllRows as useAllConfigurationRows,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAddRowCallback,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { formatDate } from '@/src/utils/formatters';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { addReceiptToQuickBooks, QBBillLineItem } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const AddReceiptPage = () => {
  const defaultDate = useMemo(() => new Date(), []);
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { isConnected, isInternetReachable, isConnectedToQuickBooks } = useNetwork();
  const auth = useAuth();
  const project = useProject(projectId);
  const projectAbbr = project?.abbreviation ?? '';
  const { userId, orgId, getToken } = auth;
  const appSettings = useAppSettings();
  const addReceiptToLocalStore = useAddRowCallback(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedVendorOption, setPickedVendorOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);
  const [applyToSingleCostCode, setApplyToSingleCostCode] = useState(false);
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const { projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions } =
    useProjectWorkItems(projectId);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setPickedSubCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [canAddReceipt, setCanAddReceipt] = useState(false);
  const allVendors = useAllConfigurationRows('vendors');
  const allAccounts = useAllConfigurationRows('accounts');
  const [paymentAccounts, setPaymentAccounts] = useState<OptionEntry[]>([]);
  const [pickedPaymentAccountOption, setPickedPaymentAccountOption] = useState<OptionEntry | undefined>(
    undefined,
  );
  const [isPaymentAccountPickerVisible, setIsPaymentAccountPickerVisible] = useState<boolean>(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const addPhotoImage = useAddImageCallback();
  const router = useRouter();
  const colors = useColors();

  const handleSubCategoryChange = useCallback((selectedSubCategory: OptionEntry) => {
    setPickedSubCategoryOption(selectedSubCategory);
  }, []);

  const [projectReceipt, setProjectReceipt] = useState<ReceiptData>({
    id: '',
    accountingId: '',
    vendor: '',
    description: '',
    amount: 0,
    receiptDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
    vendorId: '',
    paymentAccountId: appSettings.quickBooksDefaultPaymentAccountId || '',
    billId: '',
  });

  const handlePaymentAccountOptionChange = (option: OptionEntry) => {
    setPickedPaymentAccountOption(option);
    if (option) {
      setProjectReceipt((prevReceipt) => ({
        ...prevReceipt,
        paymentAccountId: option.value,
      }));
    }
    setIsPaymentAccountPickerVisible(false);
  };

  const handleVendorOptionChange = (option: OptionEntry) => {
    setPickedVendorOption(option);
    if (option) {
      setProjectReceipt((prevReceipt) => ({
        ...prevReceipt,
        vendor: option.label,
        vendorId: option.value,
      }));
    }
    setIsVendorListPickerVisible(false);
  };

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: `${vendor.name} ${
          vendor.address ? ` - ${vendor.address}` : vendor.city ? ` - ${vendor.city}` : ''
        }`,
        value: vendor.accountingId, // need the id used in QuickBooks
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  // Load payment accounts from configuration store
  useEffect(() => {
    if (allAccounts && allAccounts.length > 0) {
      // Parse configured payment account IDs
      const configuredAccountIds = appSettings.quickBooksPaymentAccounts
        ? appSettings.quickBooksPaymentAccounts.split(',').filter((id) => id.trim() !== '')
        : [];

      // Filter payment accounts (Bank, Credit Card, Other Current Asset) that are in the configured list
      const paymentList = allAccounts
        .filter((account) => configuredAccountIds.includes(account.accountingId))
        .map((account) => ({
          label: account.name,
          value: account.accountingId,
        }));

      setPaymentAccounts(paymentList);

      // Set default payment account if one is configured
      if (appSettings.quickBooksDefaultPaymentAccountId) {
        const defaultAccount = paymentList.find(
          (acc) => acc.value === appSettings.quickBooksDefaultPaymentAccountId,
        );
        if (defaultAccount) {
          setPickedPaymentAccountOption(defaultAccount);
        }
      }
    } else {
      setPaymentAccounts([]);
    }
  }, [allAccounts, appSettings.quickBooksPaymentAccounts, appSettings.quickBooksDefaultPaymentAccountId]);

  useEffect(() => {
    if (pickedPaymentAccountOption !== undefined) {
      setProjectReceipt((prevReceipt) => ({
        ...prevReceipt,
        paymentAccountId: pickedPaymentAccountOption.value,
      }));
    }
  }, [pickedPaymentAccountOption]);

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
    if (!canAddReceipt || isSavingReceipt) return;

    setIsSavingReceipt(true);

    try {
      // Phase 1: Add receipt to local store
      const receiptToAdd = {
        ...projectReceipt,
        accountingId: '', // Will be populated by backend
        markedComplete: applyToSingleCostCode && !!pickedSubCategoryOption,
      };
      const result = addReceiptToLocalStore(receiptToAdd);
      if (result.status !== 'Success') {
        console.log('Add Project receipt failed:', receiptToAdd);
        Alert.alert('Error', 'Unable to add receipt to local store.');
        return;
      }

      const receiptId = result.id;

      const receiptLineItems: WorkItemCostEntry[] = [];

      // Add line items if applying to single cost code
      if (applyToSingleCostCode && !!pickedSubCategoryOption) {
        const newLineItem: WorkItemCostEntry = {
          id: '',
          label: projectReceipt.description,
          workItemId: pickedSubCategoryOption.value,
          amount: projectReceipt.amount,
          parentId: receiptId,
          documentationType: 'receipt',
        };
        receiptLineItems.push(newLineItem);
        const addLineItemResult = addLineItem(newLineItem);
        if (addLineItemResult.status !== 'Success') {
          Alert.alert('Error', 'Unable to add line item for receipt.');
          console.log('Error adding line item for receipt:', addLineItemResult);
          router.back();
          return;
        }
      }

      // Phase 2: Send to QuickBooks if conditions are met
      // Conditions: connected to QuickBooks, has at least one line item, has amount and payment account
      const hasLineItems = receiptLineItems.length > 0;
      const hasAmount = projectReceipt.amount > 0;
      const hasPaymentAccount = !!projectReceipt.paymentAccountId;
      const hasVendorId = !!projectReceipt.vendorId;

      if (
        isConnectedToQuickBooks &&
        hasLineItems &&
        hasAmount &&
        hasPaymentAccount &&
        hasVendorId &&
        userId &&
        orgId &&
        projectAbbr
      ) {
        try {
          // Build line items for QuickBooks bill
          const qbLineItems: QBBillLineItem[] = [];
          const skippedLineItems: string[] = [];
          const qbExpenseAccountId = appSettings.quickBooksExpenseAccountId;
          //         const account = (allAccounts || []).find((acc) => acc.id === workItem?.accountId);

          for (const lineItem of receiptLineItems) {
            // Only include line items with valid account references
            if (qbExpenseAccountId) {
              qbLineItems.push({
                amount: lineItem.amount,
                description: lineItem.label,
                accountRef: qbExpenseAccountId,
              });
            } else {
              skippedLineItems.push(lineItem.label);
              console.warn(
                `Skipping line item ${lineItem.id} - no valid account reference found for work item ${lineItem.workItemId}`,
              );
            }
          }

          // Only proceed if we have valid line items
          if (qbLineItems.length === 0) {
            console.warn('No valid line items with account references - skipping QuickBooks sync');
            if (skippedLineItems.length > 0) {
              Alert.alert(
                'QuickBooks Sync Skipped',
                `Cannot sync to QuickBooks: ${skippedLineItems.length} line item(s) missing account references.`,
              );
            }
          } else {
            // Notify user if some items were skipped
            if (skippedLineItems.length > 0) {
              console.warn(
                `Warning: ${skippedLineItems.length} line item(s) were not synced to QuickBooks due to missing account references: ${skippedLineItems.join(', ')}`,
              );
            }

            // Prepare receipt data for backend
            const receiptData = {
              userId,
              orgId,
              projectId,
              projectAbbr,
              projectName: projectName || '',
              invoiceId: receiptId, // Backend API uses 'invoiceId' field for both receipts and invoices
              imageId: projectReceipt.imageId || '',
              addAttachment: !!projectReceipt.imageId,
              qbBillData: {
                vendorRef: projectReceipt.vendorId,
                lineItems: qbLineItems,
                // Note: docNumber is optional and will be auto-generated if not provided
                privateNote: projectReceipt.notes || projectReceipt.description || '',
                dueDate: new Date(projectReceipt.receiptDate).toISOString().split('T')[0],
              },
            };

            const response = await addReceiptToQuickBooks(receiptData, getToken);
            console.log('Receipt successfully synced to QuickBooks:', response);

            // Update the local receipt with accountingId and billId from response
            const updates: Partial<ReceiptData> = {};
            if (response.data?.Bill?.DocNumber) {
              // Backend returns 'accountId', but local store uses 'accountingId'
              updates.accountingId = response.data.Bill.DocNumber;
              console.log('Updating local receipt with accountingId:', response.data?.Bill?.DocNumber);
            }
            if (response.data?.Bill?.Id) {
              updates.billId = response.data.Bill.Id;
              console.log('Updating local receipt with billId:', response.data.Bill.Id);
            }

            if (Object.keys(updates).length > 0) {
              console.log('Updating local receipt with:', updates);
              updateReceipt(receiptId, updates);
            }
          }
        } catch (error) {
          console.error('Error syncing receipt to QuickBooks:', error);
          // Don't alert the user - the receipt is already saved locally
          // and they can retry syncing later if needed
        }
      }

      console.log('Project receipt successfully added:', projectReceipt);
      router.back();
    } finally {
      setIsSavingReceipt(false);
    }
  }, [
    projectReceipt,
    canAddReceipt,
    isSavingReceipt,
    addReceiptToLocalStore,
    updateReceipt,
    addLineItem,
    applyToSingleCostCode,
    pickedSubCategoryOption,
    isConnectedToQuickBooks,
    userId,
    orgId,
    projectId,
    projectAbbr,
    projectName,
    getToken,
    projectWorkItems,
    allAccounts,
    router,
    appSettings.quickBooksExpenseAccountId,
  ]);

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

        // Delete the photo from the camera roll after successfully copying to app directory
        if (asset.assetId) {
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              await MediaLibrary.deleteAssetsAsync([asset.assetId]);
              console.log('Successfully deleted photo from camera roll:', asset.assetId);
            } else {
              console.log('Media library permissions not granted, photo remains in camera roll');
            }
          } catch (error) {
            console.error('Error deleting photo from camera roll:', error);
            // Don't alert user - the image is already saved to app directory
          }
        }
      }
    }
  }, [addPhotoImage, projectId]);

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
      accountingId: '',
      vendor: '',
      vendorId: '',
      paymentAccountId: appSettings.quickBooksDefaultPaymentAccountId || '',
      description: '',
      amount: 0,
      receiptDate: defaultDate.getTime(),
      thumbnail: '',
      pictureDate: 0,
      imageId: '',
      notes: '',
      billId: '',
      markedComplete: false,
    });
    router.back();
  }, [router, defaultDate, appSettings.quickBooksDefaultPaymentAccountId]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        onSave={handleAddReceipt}
        onCancel={handleCancel}
        canSave={canAddReceipt}
        isSaving={isSavingReceipt}
        savingLabel="Saving Receipt to QuickBooks"
      >
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
              containerStyle={[styles.inputContainer, { marginBottom: 6 }]}
              optionLabel={projectReceipt.vendor}
              label="Vendor/Merchant"
              placeholder="Vendor/Merchant"
              editable={isConnectedToQuickBooks ? false : true}
              onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
            />
          ) : (
            <TextField
              containerStyle={styles.inputContainer}
              style={[styles.input, { borderColor: colors.transparent }]}
              placeholder="Vendor/Merchant"
              label="Vendor/Merchant"
              value={projectReceipt.vendor}
              editable={isConnectedToQuickBooks ? false : true}
            />
          )}

          <NumberInputField
            style={{ ...styles.inputContainer, marginTop: 0, paddingLeft: 10 }}
            labelStyle={{ marginBottom: 2 }}
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

          {paymentAccounts && paymentAccounts.length > 0 && (
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={pickedPaymentAccountOption?.label}
              label="Payment Account"
              placeholder="Payment Account"
              editable={false}
              onPickerButtonPress={() => setIsPaymentAccountPickerVisible(true)}
            />
          )}

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
          modalHeight={'60%'}
          isVisible={isVendorListPickerVisible}
          onClose={() => setIsVendorListPickerVisible(false)}
        >
          <OptionList
            options={vendors}
            onSelect={(option) => handleVendorOptionChange(option)}
            selectedOption={pickedVendorOption}
            enableSearch={vendors.length > 15}
          />
        </BottomSheetContainer>
      )}
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          modalHeight={'60%'}
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
      {paymentAccounts && isPaymentAccountPickerVisible && (
        <BottomSheetContainer
          modalHeight={'60%'}
          isVisible={isPaymentAccountPickerVisible}
          onClose={() => setIsPaymentAccountPickerVisible(false)}
        >
          <OptionList
            options={paymentAccounts}
            onSelect={(option) => handlePaymentAccountOptionChange(option)}
            selectedOption={pickedPaymentAccountOption}
            enableSearch={paymentAccounts.length > 15}
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
