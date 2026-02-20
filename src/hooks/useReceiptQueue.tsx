import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useNetwork } from '../context/NetworkContext';
import {
  useAllReceiptQueueEntries,
  useDeleteReceiptQueueEntryCallback,
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
  const deleteQueuedReceipt = useDeleteReceiptQueueEntryCallback();
  const duplicateReceiptImage = useDuplicateReceiptImageCallback();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
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

  // Helper function to create a receipt copy in a target project
  const createReceiptCopyInProject = (
    queuedReceipt: ReceiptQueueEntry,
    toProjectId: string,
    store: any,
  ): { success: boolean; msg: string } => {
    try {
      if (!store) {
        console.error(`Target project store not available for project ${toProjectId}`);
        return { success: false, msg: 'Target project store not available' };
      }

      const newReceiptId = randomUUID();

      // Create the receipt in the target project
      const receiptData = {
        accountingId: '',
        vendor: queuedReceipt.vendorRef,
        vendorId: queuedReceipt.vendorRef,
        paymentAccountId: '',
        expenseAccountId: '',
        description: `Copy of receipt from project ${queuedReceipt.fromProjectId}`,
        amount: queuedReceipt.lineItems.reduce((sum, item) => sum + item.amount, 0),
        receiptDate: queuedReceipt.createdAt,
        thumbnail: '',
        pictureDate: queuedReceipt.createdAt,
        imageId: queuedReceipt.imageId || '',
        notes: `Automatically copied from project ${queuedReceipt.fromProjectId}`,
        markedComplete: false,
        purchaseId: queuedReceipt.purchaseId,
        qbSyncHash: '',
        id: newReceiptId,
      };

      const receiptSuccess = store.setRow('receipts', newReceiptId, receiptData);
      if (!receiptSuccess) {
        console.error(`Failed to add receipt to project ${toProjectId}`);
        return { success: false, msg: 'Failed to create receipt' };
      }

      console.log(`Receipt queue: Created receipt ${newReceiptId} in project ${toProjectId}`);

      // Create work item cost entries for each line item
      for (const lineItem of queuedReceipt.lineItems) {
        const costEntryId = randomUUID();
        const costEntryData = {
          id: costEntryId,
          label: lineItem.itemDescription,
          amount: lineItem.amount,
          workItemId: '',
          parentId: newReceiptId,
          documentationType: 'receipt',
          projectId: toProjectId,
        };

        const costEntrySuccess = store.setRow('workItemCostEntries', costEntryId, costEntryData);
        if (!costEntrySuccess) {
          console.warn(`Failed to add cost entry to receipt ${newReceiptId}`);
        } else {
          console.log(
            `Receipt queue: Created cost entry for line item "${lineItem.itemDescription}" (${lineItem.amount})`,
          );
        }
      }

      return { success: true, msg: '' };
    } catch (error) {
      console.error(`Error creating receipt copy in project ${toProjectId}:`, error);
      return {
        success: false,
        msg: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

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
          const processedProjectIds: string[] = [];

          if (targetProjectIds.length === 0) {
            console.log(
              `Receipt queue: No target projects found for receipt ${queuedReceipt.purchaseId}. Removing from queue.`,
            );
            deleteQueuedReceipt(queuedReceipt.purchaseId);
            successCount++;
            setProcessedCount(successCount + failCount);
            continue;
          }

          for (const toProjectId of targetProjectIds) {
            console.log(
              `Receipt queue: Processing receipt ${queuedReceipt.purchaseId} for target project ${toProjectId}`,
            );

            // Get the store for this specific project from the cache
            const store = getStoreFromCache(toProjectId);

            if (!store) {
              console.warn(
                `Receipt queue: Store not yet loaded for project ${toProjectId}. Will retry in next cycle.`,
              );
              continue;
            }

            const result = createReceiptCopyInProject(queuedReceipt, toProjectId, store);
            if (result.success) {
              processedProjectIds.push(toProjectId);
            }
          }

          // Remove project IDs that were successfully processed
          for (const processedProjectId of processedProjectIds) {
            const index = targetProjectIds.indexOf(processedProjectId);
            if (index !== -1) {
              targetProjectIds.splice(index, 1);
            }
          }

          if (targetProjectIds.length === 0) {
            console.log(
              `Receipt queue: Successfully processed receipt ${queuedReceipt.purchaseId} for all target projects. Removing from queue.`,
            );
            deleteQueuedReceipt(queuedReceipt.purchaseId);
            successCount++;
          } else {
            console.log(
              `Receipt queue: Failed to process receipt ${queuedReceipt.purchaseId} for projects: ${targetProjectIds.join(
                ', ',
              )}. Will retry in next cycle.`,
            );
            failCount++;
          }
        } catch (error) {
          console.error(`Receipt queue: Error processing receipt ${queuedReceipt.purchaseId}:`, error);
          failCount++;
        } finally {
          setProcessedCount(successCount + failCount);
        }
      }

      console.log(
        `Receipt queue: Processing complete. Success: ${successCount}, Failed: ${failCount}, Total: ${itemsToProcess.length}`,
      );
      setIsProcessing(false);
    };

    // Run immediately on mount if there are items
    if (receiptsToProcess.length > 0) {
      void processQueue();
    }

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
  }, [
    userId,
    orgId,
    auth,
    receiptsToProcess,
    isProcessing,
    isConnected,
    isInternetReachable,
    deleteQueuedReceipt,
    duplicateReceiptImage,
    getToken,
    createReceiptCopyInProject,
  ]);

  return {
    isProcessing,
    totalItems: receiptsToProcess.length,
    processedCount,
  };
};
