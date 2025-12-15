import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthToken } from '../context/AuthTokenContext';
import { useAllFailedToUpload } from '../tbStores/UploadSyncStore';
import { mediaType, resourceType } from '../utils/images';
import { Platform } from 'react-native';
import { createApiWithRetry } from '../utils/apiWithTokenRefresh';
import { API_BASE_URL } from '../constants/app-constants';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { NoValuesSchema } from 'tinybase/with-schemas';

// Import schema from UploadSyncStore
const STORE_ID_PREFIX = 'PHV1_FailedToUploadSyncStore';
const TABLES_SCHEMA = {
  failedToUpload: {
    id: { type: 'string' },
    mediaType: { type: 'string' },
    resourceType: { type: 'string' },
    organizationId: { type: 'string' },
    projectId: { type: 'string' },
    itemId: { type: 'string' },
    localUri: { type: 'string' },
    uploadDate: { type: 'number' },
  },
} as const;

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => {
  const { userId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${userId}`, [userId]);
  return storeId;
};

interface ImageDetails {
  id: string;
  userId: string;
  orgId: string;
  projectId: string;
  longitude: number;
  latitude: number;
  deviceTypes: string;
}

type ImageResult = { status: 'Success' | 'Error'; id: string; uri?: string | undefined; msg: string };

const getAddImageEndPointUrl = (resourceType: resourceType, mediaType: mediaType) => {
  switch (resourceType) {
    case 'receipt':
      return `${API_BASE_URL}/addReceipt`;
    case 'invoice':
      return `${API_BASE_URL}/addInvoice`;
    case 'photo': {
      if (mediaType === 'video') {
        return `${API_BASE_URL}/addVideo`;
      }

      return `${API_BASE_URL}/addPhoto`;
    }
    default:
      throw new Error('Invalid resource type');
  }
};

const uploadImage = async (
  details: ImageDetails,
  token: string | null,
  refreshToken: () => Promise<string | null>,
  mediaType: mediaType,
  resourceType: resourceType,
  localImageUrl: string,
): Promise<ImageResult> => {
  try {
    const formData = new FormData();

    formData.append('id', details.id);
    formData.append('userId', details.userId);
    formData.append('organizationId', details.orgId);
    formData.append('projectId', details.projectId);
    formData.append('longitude', details.longitude.toString());
    formData.append('latitude', details.latitude.toString());
    formData.append('deviceTypes', details.deviceTypes);

    const uri = Platform.OS === 'ios' ? localImageUrl.replace('file://', '') : localImageUrl;
    const filename = localImageUrl.split('/').pop() || 'image.jpg';

    let type = '';
    if (mediaType === 'video') {
      type = 'video/mp4';
    } else if (mediaType === 'photo') {
      type = 'image/jpeg';
    }

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const endPointUrl = getAddImageEndPointUrl(resourceType, mediaType);
    console.log('Uploading image to:', endPointUrl);

    // Make the API call with token refresh
    const apiFetch = createApiWithRetry(token, refreshToken);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        // Do not set multipart Content-Type header here — fetch will set the boundary
      } as any,
      body: formData,
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Upload failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        status: 'Error',
        id: details.id,
        msg: `Upload failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    // Attempt to parse JSON but tolerate empty body
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // no JSON — acceptable
    }

    console.log('Image uploaded successfully:', data);
    return { status: 'Success', id: details.id, uri: localImageUrl, msg: 'Successfully uploaded image' };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      status: 'Error',
      id: details.id,
      msg: `Error uploading image: ${(error as Error)?.message ?? String(error)}`,
    };
  }
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

  useEffect(() => {
    // Only process once per app session
    if (hasProcessedRef.current) {
      return;
    }

    // Wait for authentication to be ready
    if (!userId || !orgId || isTokenLoading) {
      return;
    }

    // Check if there are any failed uploads to process
    if (failedUploads.length === 0) {
      return;
    }

    // Mark as processing to prevent duplicate runs
    hasProcessedRef.current = true;

    // Process uploads asynchronously without blocking UI
    const processUploads = async () => {
      setIsProcessing(true);
      console.log(`Starting upload queue processing. ${failedUploads.length} items to process.`);

      let successCount = 0;
      let failCount = 0;

      for (const item of failedUploads) {
        try {
          // Create ImageDetails from failed upload data
          const details: ImageDetails = {
            id: item.itemId,
            userId: userId,
            orgId: orgId,
            projectId: item.projectId,
            longitude: 0, // TODO: Could be stored in FailedToUploadData if needed
            latitude: 0,
            deviceTypes: '', // TODO: Could be stored in FailedToUploadData if needed
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
        `Upload queue processing complete. Success: ${successCount}, Failed: ${failCount}, Total: ${failedUploads.length}`,
      );
      setIsProcessing(false);
    };

    // Run asynchronously to avoid blocking
    processUploads();
  }, [userId, orgId, token, refreshToken, isTokenLoading, failedUploads, store]);

  return {
    isProcessing,
    totalItems: failedUploads.length,
    processedCount,
  };
};
