import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import {
  useAddRowCallback,
  useTypedRow,
  useAllRows,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddReceiptQueueEntryCallback, ReceiptLineItem } from '@/src/tbStores/ReceiptQueueStoreHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useAllProjects, useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { editReceiptInQuickBooks, QBBillLineItem } from '@/src/utils/quickbooksAPI';
import { resolveQuickBooksExpenseAccountIdForWorkItem } from '@/src/utils/quickbooksWorkItemAccounts';
import { gatherLineItemsForReceipt } from '@/src/utils/receiptUtils';
import { useAuth } from '@clerk/clerk-expo';

const AddReceiptLineItemPage = () => {
  const router = useRouter();
  const allProjects = useAllProjects();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const receipt = useTypedRow(projectId, 'receipts', receiptId);
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const allWorkItems = useAllConfigurationRows('workItems');
  const project = useProject(projectId);
  const appSettings = useAppSettings();
  const allAccounts = useAllConfigurationRows('accounts');
  const allVendors = useAllConfigurationRows('vendors');
  const { userId, orgId, getToken } = useAuth();
  const addReceiptQueueEntry = useAddReceiptQueueEntryCallback();

  const [isProjectPickerVisible, setIsProjectPickerVisible] = useState<boolean>(false);
  const [pickedProjectOption, setPickedProjectOption] = useState<OptionEntry | undefined>(undefined);
  const [projectOptions, setProjectOptions] = useState<OptionEntry[] | undefined>(undefined);

  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      const options: OptionEntry[] = allProjects.map((project) => ({
        label: project.name,
        value: project.id,
      }));
      setProjectOptions(options);

      // Set the picked project option to the current project
      if (projectId) {
        const currentProjectOption = options.find((option) => option.value === projectId);
        if (currentProjectOption) {
          setPickedProjectOption(currentProjectOption);
        }
      }
    }
  }, [allProjects, projectId]);

  const handleProjectOptionChange = (option: OptionEntry) => {
    if (option) {
      setPickedProjectOption(option);
    }
    setIsProjectPickerVisible(false);
  };

  const initItemizedEntry: WorkItemCostEntry = {
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: receiptId,
    documentationType: 'receipt',
  };

  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>(initItemizedEntry);
  const selectedProjectId = (pickedProjectOption?.value as string) ?? projectId;

  // Sync receipt to QB when new line item is added for a cross-project receipt
  const syncReceiptToQuickBooksForNewLineItem = useCallback(
    async (allLineItems: WorkItemCostEntry[]) => {
      if (!receipt?.purchaseId || !orgId || !userId || !project) return;

      try {
        if (allLineItems.length === 0) return;

        // Build QB line items
        const qbLineItems: QBBillLineItem[] = [];
        for (const lineItem of allLineItems) {
          const resolvedExpenseAccountId = resolveQuickBooksExpenseAccountIdForWorkItem({
            workItemId: lineItem.workItemId,
            workItems: allWorkItems,
            accounts: allAccounts,
            defaultExpenseAccountId: appSettings.quickBooksExpenseAccountId,
          });

          if (resolvedExpenseAccountId) {
            qbLineItems.push({
              amount: lineItem.amount.toFixed(2),
              description: lineItem.label,
              accountRef: resolvedExpenseAccountId,
              projectId: lineItem.projectId === projectId ? undefined : lineItem.projectId,
            });
          }
        }

        if (qbLineItems.length === 0) return;

        // Get vendor QB ID
        let vendorQbId = '';
        if (receipt.vendorId) {
          const vendor = allVendors.find((v) => v.id === receipt.vendorId);
          if (vendor) {
            vendorQbId = vendor.accountingId;
          }
        }

        // Get payment account subtype
        const paymentAccountSubType = allAccounts.find(
          (acc) => acc.accountingId === receipt.paymentAccountId,
        )?.accountSubType;

        const receiptEditData = {
          purchaseId: receipt.purchaseId,
          accountingId: receipt.accountingId,
          orgId,
          userId,
          projectId,
          projectAbbr: project.abbreviation || '',
          projectName: project.name,
          addAttachment: false,
          imageId: receipt.imageId || '',
          qbPurchaseData: {
            vendorRef: vendorQbId,
            lineItems: qbLineItems,
            privateNote: receipt.notes || receipt.description || '',
            txnDate: new Date(receipt.receiptDate).toISOString().split('T')[0],
            paymentAccount: {
              paymentAccountRef: receipt.paymentAccountId,
              paymentType: paymentAccountSubType,
            },
          },
        };

        console.log('Syncing new line item to QuickBooks');
        await editReceiptInQuickBooks(receiptEditData, orgId, userId, getToken);
      } catch (error) {
        console.error('Error syncing new line item to QuickBooks:', error);
      }
    },
    [
      receipt,
      orgId,
      userId,
      projectId,
      project,
      allWorkItems,
      allAccounts,
      appSettings.quickBooksExpenseAccountId,
      allVendors,
      getToken,
    ],
  );

  const handleOkPress = useCallback(async () => {
    if (!itemizedEntry.label || !itemizedEntry.amount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const newItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: itemizedEntry.workItemId,
      projectId: pickedProjectOption ? (pickedProjectOption.value as string) : projectId,
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }

    // If receipt has purchaseId and line item is for a different project, create queue entry and sync to QB
    if (receipt?.purchaseId && newItemizedEntry.projectId && newItemizedEntry.projectId !== projectId) {
      try {
        // Get updated line items including the newly added one
        const updatedLineItems = gatherLineItemsForReceipt(receiptId, [...allCostItems, newItemizedEntry]);

        // Create receipt queue entry for the target project
        const receiptLineItems: ReceiptLineItem[] = updatedLineItems.map((item) => ({
          amount: item.amount,
          itemDescription: item.label,
          projectId: item.projectId ?? projectId,
          workItemId: item.workItemId ?? '',
        }));

        const queueEntryData = {
          purchaseId: receipt.purchaseId,
          fromProjectId: projectId,
          vendorId: receipt.vendorId,
          vendor: receipt.vendor,
          paymentAccountId: receipt.paymentAccountId,
          accountingId: receipt.accountingId,
          description: receipt.description,
          receiptDate: receipt.receiptDate,
          pictureDate: receipt.pictureDate,
          thumbnail: receipt.thumbnail,
          notes: receipt.notes,
          imageId: receipt.imageId,
          lineItems: receiptLineItems,
          qbSyncHash: receipt.qbSyncHash ?? '',
        };
        addReceiptQueueEntry(queueEntryData);
        console.log(`Added receipt queue entry for new line item in project ${newItemizedEntry.projectId}`);

        // Sync to QB with all line items
        await syncReceiptToQuickBooksForNewLineItem(updatedLineItems);
      } catch (error) {
        console.error('Error processing cross-project line item addition:', error);
        // Don't fail - line item was created successfully locally
      }
    } else if (receipt?.purchaseId) {
      // If in same project with purchaseId, just sync receipt changes
      try {
        const updatedLineItems = gatherLineItemsForReceipt(receiptId, [...allCostItems, newItemizedEntry]);
        await syncReceiptToQuickBooksForNewLineItem(updatedLineItems);
      } catch (error) {
        console.error('Error syncing line item to QuickBooks:', error);
      }
    }

    router.back();
  }, [
    itemizedEntry,
    pickedProjectOption,
    addLineItem,
    router,
    projectId,
    receipt,
    receiptId,
    allCostItems,
    addReceiptQueueEntry,
    syncReceiptToQuickBooksForNewLineItem,
  ]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        onSave={handleOkPress}
        title="Add Receipt Line Item"
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
        <NumericInputField
          containerStyle={{ ...styles.inputContainer, marginTop: 0 }}
          label="Amount"
          maxDecimals={2}
          decimals={2}
          value={itemizedEntry.amount}
          onChangeNumber={(value: number | null): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              amount: value ?? 0,
            }));
          }}
        />
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Description"
          label="Description"
          value={itemizedEntry.label}
          onChangeText={(text): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              label: text,
            }));
          }}
        />
        {projectOptions && projectOptions?.length > 1 && (
          <OptionPickerItem
            containerStyle={styles.inputContainer}
            optionLabel={pickedProjectOption?.label}
            label="Project"
            placeholder="Project"
            editable={false}
            onPickerButtonPress={() => setIsProjectPickerVisible(true)}
          />
        )}
        <CostItemPicker
          style={styles.inputContainer}
          projectId={selectedProjectId}
          value={itemizedEntry.workItemId}
          onValueChange={(workItemId) => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              workItemId,
            }));
          }}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          modalTitle="Select Cost Item Type"
          modalHeight="80%"
        />
      </ModalScreenContainer>
      {isProjectPickerVisible && projectOptions && (
        <BottomSheetContainer
          modalHeight="65%"
          isVisible={isProjectPickerVisible}
          onClose={() => setIsProjectPickerVisible(false)}
        >
          <OptionList
            options={projectOptions}
            onSelect={(option) => handleProjectOptionChange(option)}
            selectedOption={pickedProjectOption}
            enableSearch={projectOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
    </View>
  );
};

export default AddReceiptLineItemPage;

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 6,
  },
});
