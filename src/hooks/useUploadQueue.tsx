import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthToken } from '../context/AuthTokenContext';
import { useNetwork } from '../context/NetworkContext';
import { useAllFailedToUpload, STORE_ID_PREFIX, TABLES_SCHEMA } from '../tbStores/UploadSyncStore';
import {
  mediaType,
  resourceType,
  ImageDetails,
  ImageResult,
  uploadImage,
} from '../utils/images';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { NoValuesSchema } from 'tinybase/with-schemas';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => {
  const { userId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${userId}`, [userId]);
  return storeId;
};

/**
 * Hook to process failed uploads in a foreground queue.
 * This hook runs once every hour and processes all failed uploads sequentially.
 * It does not block the UI as processing happens asynchronously.
 * Now includes network connectivity checks to avoid unnecessary upload attempts when offline.
 */
export const useUploadQueue = () => {
  const { userId, orgId } = useAuth();
  const { token, refreshToken, isLoading: isTokenLoading } = useAuthToken();
  const { isConnected, isInternetReachable } = useNetwork();
  const failedUploads = useAllFailedToUpload();
  const store = useStore(useStoreId());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Wait for authentication to be ready
    if (!userId || !orgId || isTokenLoading) {
      return;
    }

    // Wait for store to be ready
    if (!store) {
      return;
    }

    // Process uploads asynchronously without blocking UI
    const processUploads = async () => {
      // Skip if already processing or no items to process
      if (isProcessing || failedUploads.length === 0) {
        return;
      }

      // Skip if offline - don't attempt uploads when there's no connection
      // This prevents battery drain from failed network calls and reduces log errors
      if (!isConnected || isInternetReachable === false) {
        console.log(
          'Skipping upload queue processing: No network connection. Will retry when connectivity is restored.',
        );
        return;
      }

      setIsProcessing(true);
      const itemsToProcess = [...failedUploads];
      console.log(`Starting upload queue processing. ${itemsToProcess.length} items to process.`);

      let successCount = 0;
      let failCount = 0;

      for (const item of itemsToProcess) {
        try {
          // Create ImageDetails from failed upload data
          // Note: Using default values for longitude/latitude/deviceTypes since these are
          // not stored in FailedToUploadData. The original upload likely used real values,
          // but for retry purposes, these defaults are acceptable because:
          // - longitude/latitude: The backend doesn't require them for the actual upload operation
          // - deviceTypes: This is metadata that doesn't affect the upload success
          const details: ImageDetails = {
            id: item.itemId,
            userId,
            orgId,
            projectId: item.projectId,
            longitude: 0,
            latitude: 0,
            deviceTypes: '',
          };

          console.log(`Processing upload for item ${item.itemId} (${item.resourceType}/${item.mediaType})`);

          // Attempt to upload
          const result = await uploadImage(
            details,
            token,
            refreshToken,
            item.mediaType as mediaType,
            item.resourceType as resourceType,
            item.localUri,
          );

          if (result.status === 'Success') {
            console.log(`Successfully uploaded item ${item.itemId}`);
            successCount++;

            // Remove from failed uploads table
            store.delRow('failedToUpload', item.id);
          } else {
            console.warn(`Failed to upload item ${item.itemId}: ${result.msg}`);
            failCount++;
          }

          setProcessedCount(successCount + failCount);
        } catch (error) {
          console.error(`Error processing upload for item ${item.itemId}:`, error);
          failCount++;
          setProcessedCount(successCount + failCount);
        }
      }

      console.log(
        `Upload queue processing complete. Success: ${successCount}, Failed: ${failCount}, Total: ${itemsToProcess.length}`,
      );
      setIsProcessing(false);
    };

    // Run immediately on mount
    void processUploads();

    // Set up interval to run every hour (3600000 milliseconds)
    intervalRef.current = setInterval(() => {
      void processUploads();
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
    token,
    refreshToken,
    isTokenLoading,
    store,
    failedUploads,
    isProcessing,
    isConnected,
    isInternetReachable,
  ]);
  // Note: Including failedUploads and isProcessing in dependencies to ensure we have latest data
  // when processing runs via interval. Including isConnected and isInternetReachable to automatically
  // retry failed uploads when connectivity is restored.

  return {
    isProcessing,
    totalItems: failedUploads.length,
    processedCount,
  };
};
