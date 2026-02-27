import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useNetwork } from '../context/NetworkContext';
import {
  useAllMediaToUpload,
  useAllServerMediaToDelete,
  useUploadSyncStore,
} from '../tbStores/UploadSyncStore';
import { mediaType, resourceType, ImageDetails, uploadImage, deleteMedia } from '../utils/images';

/**
 * Hook to process media uploads and deletes in a foreground queue.
 * This hook runs once every hour and processes all queued operations sequentially.
 * It does not block the UI as processing happens asynchronously.
 * Now includes network connectivity checks to avoid unnecessary attempts when offline.
 */
export const useUploadQueue = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();
  const mediaToUpload = useAllMediaToUpload();
  const serverMediaToDelete = useAllServerMediaToDelete();
  const store = useUploadSyncStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Wait for authentication to be ready
    if (!userId || !orgId) {
      return;
    }

    // Wait for store to be ready
    if (!store) {
      return;
    }

    // Process uploads and deletes asynchronously without blocking UI
    const processQueue = async () => {
      // Skip if already processing or no items to process
      if (isProcessing || (mediaToUpload.length === 0 && serverMediaToDelete.length === 0)) {
        return;
      }

      // Skip if offline - don't attempt network operations when there's no connection
      // This prevents battery drain from failed network calls and reduces log errors
      if (!isConnected || isInternetReachable === false) {
        console.log(
          'Skipping queue processing: No network connection. Will retry when connectivity is restored.',
        );
        return;
      }

      setIsProcessing(true);
      const uploadsToProcess = [...mediaToUpload];
      const deletesToProcess = [...serverMediaToDelete];
      const totalItems = uploadsToProcess.length + deletesToProcess.length;
      console.log(
        `Starting queue processing. ${uploadsToProcess.length} uploads, ${deletesToProcess.length} deletes (${totalItems} total).`,
      );

      let successCount = 0;
      let failCount = 0;

      // Process uploads first
      for (const item of uploadsToProcess) {
        try {
          // Create ImageDetails from media upload data
          // Note: Using default values for longitude/latitude/deviceTypes since these are
          // not stored in MediaToUploadData. The original upload likely used real values,
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

          // Attempt to upload with extended timeout for queue processing (120 seconds)
          const result = await uploadImage(
            details,
            auth.getToken,
            item.mediaType as mediaType,
            item.resourceType as resourceType,
            item.localUri,
            120000,
          );

          if (result.status === 'Success') {
            console.log(`Successfully uploaded item ${item.itemId}`);
            successCount++;

            // Remove from media upload table
            store.delRow('mediaToUpload', item.id);
          } else {
            if (result.msg.startsWith('Local file does not exist')) {
              // bad file path - do not queue for retry
              // remove from mediaToUpload table
              console.warn(
                `Local file does not exist for item ${item.itemId}. **** Removing from media upload queue.****`,
              );
              store.delRow('mediaToUpload', item.id);
            }
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

      // Process deletes
      for (const item of deletesToProcess) {
        try {
          let imageIds: string[];
          try {
            imageIds = JSON.parse(item.imageIds) as string[];
          } catch (parseError) {
            console.error(
              `Failed to parse imageIds for delete item ${item.id} (data: ${item.imageIds}):`,
              parseError,
            );
            // Skip this item and continue with the next one
            failCount++;
            setProcessedCount(successCount + failCount);
            continue;
          }

          console.log(`Processing delete for ${imageIds.length} images (${item.imageType})`);

          // Attempt to delete with extended timeout for queue processing (120 seconds)
          const result = await deleteMedia(
            userId!,
            item.organizationId,
            item.projectId,
            imageIds,
            item.imageType,
            auth.getToken,
            120000,
          );

          if (result.success) {
            console.log(`Successfully deleted images: ${imageIds.join(', ')}`);
            successCount++;

            // Remove from server media delete table
            store.delRow('serverMediaToDelete', item.id);
          } else {
            console.warn(`Failed to delete images: ${result.msg}`);
            failCount++;
          }

          setProcessedCount(successCount + failCount);
        } catch (error) {
          console.error(`Error processing delete for item ${item.id}:`, error);
          failCount++;
          setProcessedCount(successCount + failCount);
        }
      }

      console.log(
        `Queue processing complete. Success: ${successCount}, Failed: ${failCount}, Total: ${totalItems}`,
      );
      setIsProcessing(false);
    };

    // Run immediately on mount
    void processQueue();

    // Set up interval to run every hour (3600000 milliseconds)
    intervalRef.current = setInterval(() => {
      void processQueue();
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
    store,
    mediaToUpload,
    serverMediaToDelete,
    isProcessing,
    isConnected,
    isInternetReachable,
  ]);
  // Note: Including mediaToUpload, serverMediaToDelete, and isProcessing in dependencies to ensure we have latest data
  // when processing runs via interval. Including isConnected and isInternetReachable to automatically
  // retry operations when connectivity is restored.

  return {
    isProcessing,
    totalItems: mediaToUpload.length + serverMediaToDelete.length,
    processedCount,
  };
};
