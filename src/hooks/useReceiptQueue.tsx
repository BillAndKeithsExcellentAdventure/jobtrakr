import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useNetwork } from '../context/NetworkContext';
import {
  useAllReceiptQueueEntries,
  useDeleteReceiptQueueEntriesCallback,
  ReceiptQueueEntry,
} from '../tbStores/ReceiptQueueStoreHooks';
import { useDuplicateReceiptImageCallback } from '../utils/images';
import { useActiveProjectIds } from '../context/ActiveProjectIdsContext';
import { useProjectDetailsStoreCache } from '../context/ProjectDetailsStoreCacheContext';
import { randomUUID } from 'expo-crypto';

/**
 * Hook to process receipt queue entries in a foreground queue.
 * This hook runs once every hour and processes queued receipts sequentially.
 * For each queued receipt, it:
 * 1. Duplicates the receipt image to all target projects (if present)
 * 2. Creates a copy of the receipt in each target project with line items
 * 3. Removes the queued entry after successful processing
 *
 * It does not block the UI as processing happens asynchronously.
 * Includes network connectivity checks to avoid unnecessary attempts when offline.
 */
export const useReceiptQueue = () => {
  const auth = useAuth();
  const { userId, orgId, getToken } = auth;
  const { isConnected, isInternetReachable } = useNetwork();
  const receiptsToProcess = useAllReceiptQueueEntries();
  const deleteQueuedReceipts = useDeleteReceiptQueueEntriesCallback();
  const duplicateReceiptImage = useDuplicateReceiptImageCallback();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const { addActiveProjectIds } = useActiveProjectIds();
  const { getStoreFromCache } = useProjectDetailsStoreCache();

  // Get unique target projects from line items (excluding fromProjectId)
  const receiptProjectIds = useMemo(() => {
    const targetProjectIds = new Set<string>();
    for (const receiptEntry of receiptsToProcess) {
      for (const lineItem of receiptEntry.lineItems) {
        if (lineItem.projectId && lineItem.projectId !== receiptEntry.fromProjectId) {
          targetProjectIds.add(lineItem.projectId);
        }
      }
    }
    return Array.from(targetProjectIds);
  }, [receiptsToProcess]);

  useEffect(() => {
    if (receiptProjectIds.length === 0) return;
    addActiveProjectIds(receiptProjectIds);
  }, [receiptProjectIds, addActiveProjectIds]);

  // Helper function to create or merge a receipt copy in a target project
  const createReceiptCopyInProject = useCallback(
    (
      queuedReceipt: ReceiptQueueEntry,
      toProjectId: string,
      store: any,
    ): { success: boolean; msg: string; createdNewReceipt: boolean } => {
      try {
        if (!store) {
          console.error(`Target project store not available for project ${toProjectId}`);
          return { success: false, msg: 'Target project store not available', createdNewReceipt: false };
        }

        const receiptIds = store.getRowIds('receipts') as string[];
        const existingReceiptId = receiptIds.find(
          (id) => store.getCell('receipts', id, 'purchaseId') === queuedReceipt.purchaseId,
        );

        const receiptId = existingReceiptId ?? randomUUID();
        const isNewReceipt = !existingReceiptId;

        // Create or update the receipt in the target project
        const receiptData = {
          accountingId: queuedReceipt.accountingId,
          vendor: queuedReceipt.vendor,
          vendorId: queuedReceipt.vendorId,
          paymentAccountId: queuedReceipt.paymentAccountId,
          expenseAccountId: queuedReceipt.accountingId,
          description: queuedReceipt.description,
          amount: queuedReceipt.lineItems.reduce((sum, item) => sum + item.amount, 0),
          receiptDate: queuedReceipt.receiptDate,
          thumbnail: queuedReceipt.thumbnail,
          pictureDate: queuedReceipt.pictureDate,
          imageId: queuedReceipt.imageId || '',
          notes: queuedReceipt.notes,
          markedComplete: false,
          purchaseId: queuedReceipt.purchaseId,
          qbSyncHash: queuedReceipt.qbSyncHash,
          id: receiptId,
        };

        const receiptSuccess = store.setRow('receipts', receiptId, receiptData);
        if (!receiptSuccess) {
          console.error(`Failed to add receipt to project ${toProjectId}`);
          return { success: false, msg: 'Failed to create or update receipt', createdNewReceipt: false };
        }

        console.log(
          `Receipt queue: ${isNewReceipt ? 'Created' : 'Updated'} receipt ${receiptId} in project ${toProjectId}`,
        );

        const existingCostEntryIds = new Set<string>();
        const costEntryRowIds = store.getRowIds('workItemCostEntries') as string[];
        for (const rowId of costEntryRowIds) {
          if (store.getCell('workItemCostEntries', rowId, 'parentId') !== receiptId) {
            continue;
          }
          const label = store.getCell('workItemCostEntries', rowId, 'label') ?? '';
          const amount = Number(store.getCell('workItemCostEntries', rowId, 'amount') ?? 0);
          const workItemId = store.getCell('workItemCostEntries', rowId, 'workItemId') ?? '';
          const projectId = store.getCell('workItemCostEntries', rowId, 'projectId') ?? '';
          existingCostEntryIds.add(`${label}|${amount}|${workItemId}|${projectId}`);
        }

        // Upsert cost entries: add only entries that don't already exist for this receipt.
        for (const lineItem of queuedReceipt.lineItems) {
          const normalizedProjectId = lineItem.projectId === toProjectId ? '' : lineItem.projectId;
          const dedupeKey = `${lineItem.itemDescription}|${lineItem.amount}|${lineItem.workItemId}|${normalizedProjectId}`;
          if (existingCostEntryIds.has(dedupeKey)) {
            continue;
          }

          const costEntryId = randomUUID();
          const costEntryData = {
            id: costEntryId,
            label: lineItem.itemDescription,
            amount: lineItem.amount,
            workItemId: lineItem.workItemId,
            parentId: receiptId,
            documentationType: 'receipt',
            projectId: lineItem.projectId === toProjectId ? undefined : lineItem.projectId,
          };

          const costEntrySuccess = store.setRow('workItemCostEntries', costEntryId, costEntryData);
          if (!costEntrySuccess) {
            console.warn(`Failed to add cost entry to receipt ${receiptId}`);
          } else {
            console.log(
              `Receipt queue: Created cost entry for line item "${lineItem.itemDescription}" (${lineItem.amount})`,
            );
          }
        }

        // Recalculate receipt total from all entries currently attached to this receipt.
        const updatedCostEntryIds = store.getRowIds('workItemCostEntries') as string[];
        const updatedAmount = updatedCostEntryIds.reduce((sum, rowId) => {
          if (store.getCell('workItemCostEntries', rowId, 'parentId') !== receiptId) {
            return sum;
          }
          return sum + Number(store.getCell('workItemCostEntries', rowId, 'amount') ?? 0);
        }, 0);
        store.setCell('receipts', receiptId, 'amount', updatedAmount);

        return { success: true, msg: '', createdNewReceipt: isNewReceipt };
      } catch (error) {
        console.error(`Error creating receipt copy in project ${toProjectId}:`, error);
        return {
          success: false,
          msg: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          createdNewReceipt: false,
        };
      }
    },
    [],
  );

  useEffect(() => {
    // Wait for authentication to be ready
    if (!userId || !orgId) {
      console.log('Receipt queue: Waiting for auth (userId or orgId missing)');
      return;
    }

    // Process receipts asynchronously without blocking UI
    const processQueue = async () => {
      // Skip if already processing or no items to process
      if (isProcessing || receiptsToProcess.length === 0) {
        return;
      }

      // Skip if offline - don't attempt network operations when there's no connection
      if (!isConnected || isInternetReachable === false) {
        console.log(
          'Receipt queue: Skipping - no network connection. Will retry when connectivity is restored.',
        );
        return;
      }

      setIsProcessing(true);
      const itemsToProcess = [...receiptsToProcess];
      console.log(`Receipt queue: Starting processing of ${itemsToProcess.length} queued receipts`);

      let successCount = 0;
      let failCount = 0;
      const idsToDelete: string[] = [];

      // Process each queued receipt
      for (const queuedReceipt of itemsToProcess) {
        try {
          console.log(
            `Receipt queue: Processing queued receipt ${queuedReceipt.purchaseId} from project ${queuedReceipt.fromProjectId}`,
          );

          // Get unique target projects from line items (excluding fromProjectId)
          const targetProjectIdSet = new Set<string>();
          for (const lineItem of queuedReceipt.lineItems) {
            if (lineItem.projectId && lineItem.projectId !== queuedReceipt.fromProjectId) {
              targetProjectIdSet.add(lineItem.projectId);
            }
          }

          const targetProjectIds = Array.from(targetProjectIdSet);

          if (targetProjectIds.length === 0) {
            console.log(
              `Receipt queue: No target projects found for receipt ${queuedReceipt.purchaseId}. Marking for removal.`,
            );
            idsToDelete.push(queuedReceipt.id);
            successCount++;
            setProcessedCount(successCount + failCount);
            continue;
          }

          const missingProjectIds = targetProjectIds.filter((toProjectId) => !getStoreFromCache(toProjectId));
          if (missingProjectIds.length > 0) {
            console.warn(
              `Receipt queue: Waiting for target stores to load for receipt ${queuedReceipt.purchaseId}: ${missingProjectIds.join(', ')}`,
            );
            continue;
          }

          for (const toProjectId of targetProjectIds) {
            console.log(
              `Receipt queue: Processing receipt ${queuedReceipt.purchaseId} for target project ${toProjectId}`,
            );

            const store = getStoreFromCache(toProjectId);
            if (!store) {
              throw new Error(`Store unexpectedly unavailable for project ${toProjectId} during processing.`);
            }

            const result = createReceiptCopyInProject(queuedReceipt, toProjectId, store);
            if (!result.success) {
              throw new Error(
                result.msg || `Failed to process receipt ${queuedReceipt.purchaseId} for ${toProjectId}`,
              );
            }

            if (queuedReceipt.imageId && result.createdNewReceipt) {
              const duplicateResult = await duplicateReceiptImage(
                queuedReceipt.fromProjectId,
                toProjectId,
                queuedReceipt.imageId,
              );
              if (!duplicateResult.success) {
                console.warn(
                  `Receipt queue: Image duplication failed for receipt ${queuedReceipt.purchaseId}: ${duplicateResult.msg}`,
                );
              } else {
                console.log(
                  `Receipt queue: Successfully duplicated image for receipt ${queuedReceipt.purchaseId} to target project ${toProjectId}`,
                );
              }
            }
          }

          // All target projects processed successfully, mark for deletion
          idsToDelete.push(queuedReceipt.id);
          successCount++;
        } catch (error) {
          console.error(`Receipt queue: Error processing receipt ${queuedReceipt.purchaseId}:`, error);
          failCount++;
        } finally {
          setProcessedCount(successCount + failCount);
        }
      }

      // Delete all successfully processed entries at once
      if (idsToDelete.length > 0) {
        console.log(`Receipt queue: Deleting ${idsToDelete.length} processed entries`);
        const deleteResult = deleteQueuedReceipts(idsToDelete);
        console.log(`Receipt queue: Delete result - ${deleteResult.msg}`);
      }

      console.log(
        `Receipt queue: Processing complete. Success: ${successCount}, Failed: ${failCount}, Total: ${itemsToProcess.length}`,
      );
      setIsProcessing(false);
    };

    // Run immediately on mount and when dependencies change if there are items to process
    if (receiptsToProcess.length > 0) {
      void processQueue();
    }

    /*
    // Set up interval to run every hour (3600000 milliseconds)
    intervalRef.current = setInterval(() => {
      if (receiptsToProcess.length > 0) {
        void processQueue();
      }
    }, 3600000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    */
  }, [
    userId,
    orgId,
    auth,
    receiptsToProcess,
    isProcessing,
    isConnected,
    isInternetReachable,
    deleteQueuedReceipts,
    duplicateReceiptImage,
    getToken,
    getStoreFromCache,
    createReceiptCopyInProject,
  ]);

  return {
    isProcessing,
    totalItems: receiptsToProcess.length,
    processedCount,
  };
};
