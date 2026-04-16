import { ActionButton } from '@/src/components/ActionButton';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { VendorPicker } from '@/src/components/VendorPicker';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import {
  isEntitlementLimitReached,
  useAppSettings,
  useEntitlementLimit,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  VendorData,
  useAllRows as useAllConfigurationRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  InvoiceData,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAllMediaToUpload } from '@/src/tbStores/UploadSyncStore';
import { formatDate } from '@/src/utils/formatters';
import { useAddImageCallback } from '@/src/utils/images';
import { addBill, AddBillRequest } from '@/src/utils/quickbooksAPI';
import { resolveQuickBooksExpenseAccountIdForWorkItem } from '@/src/utils/quickbooksWorkItemAccounts';
import { getBillSyncHash } from '@/src/utils/quickbooksSyncHash';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const waitForImageUpload = (
  imageId: string,
  getLatestMedia: () => { itemId: string }[],
  maxWaitMs = 60000,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (!getLatestMedia().some((item) => item.itemId === imageId)) {
        resolve();
        return;
      }
      if (Date.now() - startTime > maxWaitMs) {
        reject(new Error(`Timed out waiting for image ${imageId} to finish uploading`));
        return;
      }
      setTimeout(check, 2000);
    };
    check();
  });

const AddInvoicePage = () => {
  const { isQuickBooksAccessible } = useNetwork();
  const { userId, orgId, getToken } = useAuth();
  const defaultDate = useMemo(() => new Date(), []);
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { isConnected, isInternetReachable } = useNetwork();
  const addInvoice = useAddRowCallback(projectId, 'invoices');
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const [applyToSingleCostCode, setApplyToSingleCostCode] = useState(false);
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const { projectWorkItems } = useProjectWorkItems(projectId);
  const appSettings = useAppSettings();
  const invoiceLimit = useEntitlementLimit('numInvoices');
  const allProjectInvoices = useAllRows(projectId, 'invoices');
  const [pickedCostItemId, setPickedCostItemId] = useState<string | undefined>(undefined);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dueDatePickerVisible, setDueDatePickerVisible] = useState(false);
  const [canAddInvoice, setCanAddInvoice] = useState(false);
  const addPhotoImage = useAddImageCallback();
  const allVendors = useAllConfigurationRows('vendors');
  const allAccounts = useAllConfigurationRows('accounts');
  const currentProject = useProject(projectId);

  const router = useRouter();
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });
  const startProcessing = useCallback(
    (label: string) => setProcessingInfo({ isProcessing: true, label }),
    [],
  );
  const stopProcessing = useCallback(() => setProcessingInfo({ isProcessing: false, label: '' }), []);
  const mediaToUpload = useAllMediaToUpload();
  const mediaToUploadRef = useRef(mediaToUpload);
  useEffect(() => {
    mediaToUploadRef.current = mediaToUpload;
  }, [mediaToUpload]);
  const [projectInvoice, setProjectInvoice] = useState<InvoiceData>({
    id: '',
    accountingId: '',
    vendor: '',
    vendorId: '',
    paymentAccountId: '',
    description: '',
    amount: 0,
    invoiceDate: defaultDate.getTime(),
    dueDate: defaultDate.getTime() + 30 * 24 * 60 * 60 * 1000, // default due date to 1 month from now
    paymentStatus: 'pending',
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
    invoiceNumber: '',
    billId: '',
    qbSyncHash: '',
  });

  const handleVendorSelected = useCallback((vendor: VendorData) => {
    setProjectInvoice((prevInvoice) => ({
      ...prevInvoice,
      vendor: vendor.name,
      vendorId: vendor.id,
    }));
  }, []);

  const selectedVendor = useMemo(
    () => allVendors.find((v) => v.id === projectInvoice.vendorId),
    [allVendors, projectInvoice.vendorId],
  );

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
      invoiceDate: date.getTime(),
    }));

    hideDatePicker();
  }, []);

  const showDueDatePicker = () => {
    setDueDatePickerVisible(true);
  };

  const hideDueDatePicker = () => {
    setDueDatePickerVisible(false);
  };

  const handleDueDateConfirm = useCallback((date: Date) => {
    setProjectInvoice((prevInvoice) => ({
      ...prevInvoice,
      dueDate: date.getTime(),
    }));

    hideDueDatePicker();
  }, []);

  const handleAddInvoice = useCallback(async () => {
    if (!canAddInvoice) return;

    if (invoiceLimit === null) {
      Alert.alert('Bills Unavailable', 'Invoice limits are still loading. Please try again in a moment.');
      return;
    }

    if (isEntitlementLimitReached(invoiceLimit, allProjectInvoices.length)) {
      Alert.alert(
        'Invoice limit reached',
        `Your subscription allows up to ${invoiceLimit} invoice(s) for this project.`,
      );
      return;
    }

    const invoiceToAdd = {
      ...projectInvoice,
      accountingId: '', // Will be populated by backend
      markedComplete: applyToSingleCostCode && !!pickedCostItemId,
    };
    const result = addInvoice(invoiceToAdd);
    if (result.status !== 'Success' || !result.id) {
      console.log('Add Project invoice failed:', invoiceToAdd);
      Alert.alert('Error', 'Unable to add invoice. Please try again.');
      return;
    }
    const newInvoiceId = result.id;
    if (applyToSingleCostCode && !!pickedCostItemId) {
      const newLineItem: WorkItemCostEntry = {
        id: '',
        label: projectInvoice.description,
        workItemId: pickedCostItemId,
        amount: projectInvoice.amount,
        parentId: newInvoiceId,
        documentationType: 'invoice',
      };
      const addLineItemResult = addLineItem(newLineItem);
      if (addLineItemResult.status !== 'Success') {
        Alert.alert('Error', 'Unable to add line item for invoice.');
        console.log('Error adding line item for invoice:', addLineItemResult);
        return;
      }

      // if connected to QuickBooks add the invoice as a Bill in QuickBooks and save
      // the returned Bill.Id to the invoice as billId and the Bill.DocNumber to accountingId for future updates
      const resolvedExpenseAccountId = resolveQuickBooksExpenseAccountIdForWorkItem({
        workItemId: newLineItem.workItemId,
        workItems: projectWorkItems,
        accounts: allAccounts,
        defaultExpenseAccountId: appSettings.quickBooksExpenseAccountId,
      });

      if (
        isQuickBooksAccessible &&
        orgId &&
        userId &&
        getToken &&
        invoiceToAdd.amount &&
        invoiceToAdd.vendorId &&
        resolvedExpenseAccountId &&
        invoiceToAdd.description
      ) {
        const vendorQbId = allVendors?.find((vendor) => vendor.id === invoiceToAdd.vendorId)?.accountingId;
        const qbBill: AddBillRequest = {
          projectId,
          projectAbbr: currentProject?.abbreviation ?? '',
          projectName: currentProject?.name ?? '',
          addAttachment: !!invoiceToAdd.imageId,
          imageId: projectInvoice.imageId,
          qbBillData: {
            vendorRef: vendorQbId ?? '',
            invoiceDate: new Date(projectInvoice.invoiceDate).toISOString().split('T')[0],
            dueDate: projectInvoice.dueDate
              ? new Date(projectInvoice.dueDate).toISOString().split('T')[0]
              : '',
            lineItems: [
              {
                description: invoiceToAdd.description,
                amount: invoiceToAdd.amount,
                accountRef: resolvedExpenseAccountId,
              },
            ],
          },
        };

        startProcessing('Adding Bill to QuickBooks...');
        try {
          // Wait for image to finish uploading if it's still in the upload queue
          if (projectInvoice.imageId) {
            const isInQueue = mediaToUploadRef.current.some((item) => item.itemId === projectInvoice.imageId);
            if (isInQueue) {
              console.log(
                `Image ${projectInvoice.imageId} is in upload queue. Waiting before adding bill to QuickBooks...`,
              );
              await waitForImageUpload(projectInvoice.imageId, () => mediaToUploadRef.current);
            }
          }
          const response = await addBill(orgId, userId, qbBill, getToken);

          const hash = await getBillSyncHash(invoiceToAdd, [newLineItem]);
          // Save the QuickBooks Bill Id and DocNumber to the invoice for future reference
          const updatedInvoice: InvoiceData = {
            ...invoiceToAdd,
            id: newInvoiceId,
            billId: response.data?.Bill?.Id ?? '',
            accountingId: response.data?.Bill?.DocNumber ?? '',
            qbSyncHash: hash,
          };
          updateInvoice(newInvoiceId, updatedInvoice);
          stopProcessing();
        } catch (error) {
          stopProcessing();
          console.error('Error adding bill to QuickBooks:', error);
          Alert.alert(
            'QuickBooks Sync Failed',
            'The invoice was added successfully, but syncing with QuickBooks failed. Please check your connection and try syncing again from the bill details screen.',
          );
          return;
        }
      }
    }

    console.log('Project invoice successfully added:', projectInvoice);
    router.back();
  }, [
    projectInvoice,
    canAddInvoice,
    addInvoice,
    addLineItem,
    applyToSingleCostCode,
    pickedCostItemId,
    router,
    isQuickBooksAccessible,
    orgId,
    userId,
    getToken,
    allAccounts,
    allVendors,
    currentProject,
    projectId,
    projectWorkItems,
    appSettings.quickBooksExpenseAccountId,
    startProcessing,
    stopProcessing,
    updateInvoice,
    invoiceLimit,
    allProjectInvoices.length,
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

        setProjectInvoice((prevInvoice) => ({
          ...prevInvoice,
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

  useEffect(() => {
    if (applyToSingleCostCode && !pickedCostItemId) {
      setCanAddInvoice(false);
    } else {
      setCanAddInvoice(
        (projectInvoice.amount > 0 && !!projectInvoice.vendor && !!projectInvoice.description) ||
          !!projectInvoice.imageId,
      );
    }
  }, [projectInvoice, applyToSingleCostCode, pickedCostItemId]);

  const handleCancel = useCallback(() => {
    // clear state of invoice data
    setProjectInvoice({
      id: '',
      accountingId: '',
      vendor: '',
      vendorId: '',
      paymentAccountId: '',
      description: '',
      amount: 0,
      invoiceDate: defaultDate.getTime(),
      dueDate: defaultDate.getTime(),
      paymentStatus: 'pending',
      thumbnail: '',
      pictureDate: 0,
      imageId: '',
      notes: '',
      markedComplete: false,
      invoiceNumber: '',
      billId: '',
      qbSyncHash: '',
    });
    router.back();
  }, [router, defaultDate]);

  const handleSetApplyToSingleCostCode = useCallback((value: boolean) => {
    setApplyToSingleCostCode(value);
    Keyboard.dismiss();
  }, []);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleAddInvoice} onCancel={handleCancel} canSave={canAddInvoice}>
        <Text txtSize="title" style={styles.modalTitle} text="Add Bill" />
        <Text txtSize="xs" style={[styles.modalTitle, { fontWeight: '600' }]} text={projectName} />

        <View style={{ paddingBottom: 10, borderBottomWidth: 1, gap: 6, borderColor: colors.border }}>
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Bill/Invoice Number"
            label="Bill/Invoice Number"
            value={projectInvoice.invoiceNumber}
            onChangeText={(invoiceNumber) =>
              setProjectInvoice((prevInvoice) => ({
                ...prevInvoice,
                invoiceNumber,
              }))
            }
          />

          <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
            <Text txtSize="formLabel" text="Bill Date" style={styles.inputLabel} />
            <TextInput
              readOnly={true}
              style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
              placeholder="Bill Date"
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

          <TouchableOpacity activeOpacity={1} onPress={showDueDatePicker}>
            <Text txtSize="formLabel" text="Due Date" style={styles.inputLabel} />
            <TextInput
              readOnly={true}
              style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
              placeholder="Due Date"
              onPressIn={showDueDatePicker}
              value={formatDate(projectInvoice.dueDate)}
            />
          </TouchableOpacity>
          <DateTimePickerModal
            style={{ alignSelf: 'stretch' }}
            date={projectInvoice.dueDate ? new Date(projectInvoice.dueDate) : defaultDate}
            isVisible={dueDatePickerVisible}
            mode="date"
            onConfirm={handleDueDateConfirm}
            onCancel={hideDueDatePicker}
          />

          <VendorPicker
            selectedVendor={selectedVendor}
            onVendorSelected={handleVendorSelected}
            vendors={allVendors}
            label="Vendor/Merchant"
            placeholder="Vendor/Merchant"
          />

          <NumericInputField
            containerStyle={{ marginTop: 0 }}
            inputStyle={{ paddingHorizontal: 10 }}
            placeholder="Amount"
            label="Amount"
            maxDecimals={2}
            decimals={2}
            selectOnFocus={true}
            value={projectInvoice.amount}
            onChangeNumber={(amount: number | null) =>
              setProjectInvoice((prevInvoice) => ({
                ...prevInvoice,
                amount: amount ?? 0,
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
              type={!isConnected || isInternetReachable === false ? 'disabled' : 'action'}
              title={projectInvoice.imageId ? 'Retake Picture' : 'Take Picture'}
            />
          </View>

          <View style={styles.applyToSingleCostCodeRow}>
            <Switch
              value={applyToSingleCostCode}
              onValueChange={handleSetApplyToSingleCostCode}
              size="large"
            />
            <Text text="Apply to Single Cost Code" txtSize="standard" style={{ marginLeft: 10 }} />
          </View>

          {applyToSingleCostCode && (
            <CostItemPicker
              style={styles.inputContainer}
              projectId={projectId}
              value={pickedCostItemId}
              onValueChange={setPickedCostItemId}
              label="Cost Item Type"
              placeholder="Cost Item Type"
              modalTitle="Select Cost Item Type"
              modalHeight="80%"
            />
          )}
        </View>
      </ModalScreenContainer>
      <Modal transparent animationType="fade" visible={processingInfo.isProcessing}>
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.processingLabel}>{processingInfo.label}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 0,
  },
  inputLabel: {
    marginTop: 0,
    marginBottom: 0,
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
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AddInvoicePage;
