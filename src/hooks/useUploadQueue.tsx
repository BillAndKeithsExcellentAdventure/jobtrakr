import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthToken } from '../context/AuthTokenContext';
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
 * This hook runs once when the component mounts and processes all failed uploads sequentially.
 * It does not block the UI as processing happens asynchronously.
 */
export const useUploadQueue = () => {
  const { userId, orgId } = useAuth();
  const { token, refreshToken, isLoading: isTokenLoading } = useAuthToken();
  const failedUploads = useAllFailedToUpload();
  const store = useStore(useStoreId());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const hasProcessedRef = useRef(false);
  const initialFailedUploadsRef = useRef<any[]>([]);

  useEffect(() => {
    // Only process once per app session
    if (hasProcessedRef.current) {
      return;
    }

    // Wait for authentication to be ready
    if (!userId || !orgId || isTokenLoading) {
      return;
    }

    // Wait for store to be ready
    if (!store) {
      return;
    }

    // Check if there are any failed uploads to process
    if (failedUploads.length === 0) {
      return;
    }

    // Capture the initial list of failed uploads
    if (initialFailedUploadsRef.current.length === 0) {
      initialFailedUploadsRef.current = [...failedUploads];
    }

    // Mark as processing to prevent duplicate runs
    hasProcessedRef.current = true;

    // Process uploads asynchronously without blocking UI
    const processUploads = async () => {
      setIsProcessing(true);
      const itemsToProcess = initialFailedUploadsRef.current;
      console.log(`Starting upload queue processing. ${itemsToProcess.length} items to process.`);

      let successCount = 0;
      let failCount = 0;

      for (const item of itemsToProcess) {
        try {
          // Create ImageDetails from failed upload data
          // Note: Using default values for longitude/latitude/deviceTypes since these are
          // not stored in FailedToUploadData. The original upload likely used real values,
          // but for retry purposes, these defaults are acceptable as the backend doesn't
          // require them for the retry operation.
          const details: ImageDetails = {
            id: item.itemId,
            userId: userId,
            orgId: orgId,
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
            if (store) {
              store.delRow('failedToUpload', item.id);
            }
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

    // Run asynchronously to avoid blocking
    processUploads();
  }, [userId, orgId, token, refreshToken, isTokenLoading, store, failedUploads.length]);

  return {
    isProcessing,
    totalItems: failedUploads.length,
    processedCount,
  };
};
