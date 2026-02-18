import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { Paths, File, Directory } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
  MediaToUploadData,
  useAddMediaToUploadCallback,
  ServerMediaToDeleteData,
  useAddServerMediaToDeleteCallback,
  useAllMediaToUpload,
} from '@/src/tbStores/UploadSyncStore';
import { API_BASE_URL } from '../constants/app-constants';
import { useNetwork } from '../context/NetworkContext';
import { createApiWithToken } from './apiWithToken';

export type ImageResult = { status: 'Success' | 'Error'; id: string; uri?: string | undefined; msg: string };

export interface ImageDetails {
  id: string;
  userId: string;
  orgId: string;
  projectId: string;
  longitude: number;
  latitude: number;
  deviceTypes: string;
}

export type mediaType = 'photo' | 'video';
export type resourceType = 'receipt' | 'invoice' | 'photo';

/**
 * Formats an error object into a string message for logging and display.
 * @param error - The error object to format
 * @returns Formatted error message string
 */
const formatErrorMessage = (error: unknown): string => {
  return (error as Error)?.message ?? String(error);
};

export const getAddImageEndPointUrl = (resourceType: resourceType, mediaType: mediaType) => {
  switch (resourceType) {
    case 'receipt':
      return `${API_BASE_URL}/addReceiptImage`;
    case 'invoice':
      return `${API_BASE_URL}/addInvoiceImage`;
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

const getFetchImageEndPointUrl = (resourceType: resourceType) => {
  switch (resourceType) {
    case 'receipt':
      return `${API_BASE_URL}/fetchReceiptImage`;
    case 'invoice':
      return `${API_BASE_URL}/fetchInvoiceImage`;
    case 'photo':
      return `${API_BASE_URL}/fetchPhoto`;
    default:
      throw new Error('Invalid resource type');
  }
};

const downloadImage = async (
  details: ImageDetails,
  getToken: () => Promise<string | null>,
  resourceType: resourceType,
  localUri: string,
): Promise<ImageResult> => {
  try {
    const params = new URLSearchParams({
      userId: details.userId,
      projectId: details.projectId,
      organizationId: details.orgId,
      imageId: details.id,
    }).toString();

    const endPointUrl = `${getFetchImageEndPointUrl(resourceType)}?${params}`;
    console.log('Downloading image from:', endPointUrl);

    // Make the API call with token refresh
    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // console.log('Image download response:', JSON.stringify(response));
    // Get the image data as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('Image download arrayBuffer.byteLength:', arrayBuffer.byteLength);

    // Convert arrayBuffer to base64 using Expo FileSystem
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Data = arrayBufferToBase64(uint8Array);
    console.log('Image download base64Data.length:', base64Data.length);

    // Ensure directory exists
    const directory = localUri.substring(0, localUri.lastIndexOf('/'));
    const dir = new Directory(directory);
    if (dir.exists === false) {
      console.log(`Directory does not exist. Creating: ${directory}`);
      dir.create({ intermediates: true, idempotent: true });
    }

    // Write the base64 data to file
    console.log('Writing image to local URI:', localUri);
    const file = new File(localUri);
    file.write(base64Data, { encoding: 'base64' });

    console.log(`File downloaded and saved to ${localUri}`);

    return {
      status: 'Success',
      id: details.id,
      uri: localUri,
      msg: 'Successfully downloaded and saved image',
    };
  } catch (error) {
    console.error('Error downloading image:', error);
    return {
      status: 'Error',
      id: details.id,
      msg: `Failed to download image: ${error}`,
    };
  }
};

// Add this helper function at the top of your file
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return global.btoa(binary);
}

export const uploadImage = async (
  details: ImageDetails,
  getToken: () => Promise<string | null>,
  mediaType: mediaType,
  resourceType: resourceType,
  localImageUrl: string,
  timeoutMs: number = 30000,
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

    const file = new File(uri);
    if (!file.exists) {
      return {
        status: 'Error',
        id: details.id,
        msg: `Local file does not exist at path: ${uri}`,
      };
    }

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const endPointUrl = getAddImageEndPointUrl(resourceType, mediaType);
    console.log('Uploading image to:', endPointUrl);

    // Make the API call with token refresh
    const apiFetch = createApiWithToken(getToken, timeoutMs);
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
    console.log('Error uploading image:', error);
    return {
      status: 'Error',
      id: details.id,
      msg: `Error uploading image: ${formatErrorMessage(error)}`,
    };
  }
};

export const deleteMedia = async (
  userId: string,
  organizationId: string,
  projectId: string,
  imageIds: string[],
  imageType: string,
  getToken: () => Promise<string | null>,
  timeoutMs: number = 30000,
) => {
  try {
    const endPointUrl = `${API_BASE_URL}/deleteMedia`;

    // Make the API call with token refresh
    const apiFetch = createApiWithToken(getToken, timeoutMs);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      } as any,
      body: JSON.stringify({
        userId: userId,
        organizationId: organizationId,
        projectId: projectId,
        imageIds: imageIds,
        imageType: imageType,
      }),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Delete media failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Delete media failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    // Attempt to parse JSON but tolerate empty body
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // no JSON — acceptable
    }

    console.log('Image deleted successfully:', data);
    return { success: true, msg: 'Successfully deleted image' };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      msg: `Error deleting image: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * Helper function to create a ServerMediaToDeleteData object.
 * Note: The id field is initialized to empty string and will be replaced
 * by the addServerMediaToDeleteRecord callback with a generated UUID.
 */
const createServerMediaToDeleteData = (
  orgId: string,
  projectId: string,
  imageIds: string[],
  imageType: string,
): ServerMediaToDeleteData => ({
  id: '', // Will be replaced by the callback with a generated UUID
  organizationId: orgId,
  projectId: projectId,
  imageIds: JSON.stringify(imageIds),
  imageType: imageType,
  deleteDate: Date.now(),
});

/**
 * API call to duplicate a receipt image from one project to another.
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param fromProjectId - Source project ID
 * @param toProjectId - Target project ID
 * @param imageId - Receipt image ID
 * @param getToken - Token getter function
 */
const duplicateReceiptImage = async (
  userId: string,
  orgId: string,
  fromProjectId: string,
  toProjectId: string,
  imageId: string,
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; copiedBuckets?: string[] }> => {
  try {
    const endPointUrl = `${API_BASE_URL}/duplicateReceiptImage`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        orgId: orgId,
        fromProjectId: fromProjectId,
        toProjectId: toProjectId,
        imageId: imageId,
      }),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Duplicate receipt image failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Duplicate receipt image failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Receipt image duplicated successfully:', data);
    return {
      success: true,
      msg: data?.message || 'Receipt image duplicated successfully',
      copiedBuckets: data?.copiedBuckets,
    };
  } catch (error) {
    console.error('Error duplicating receipt image:', error);
    return {
      success: false,
      msg: `Error duplicating receipt image: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * API call to make photos public.
 * @param userId - User ID
 * @param projectId - Project ID
 * @param imageIds - Array of image IDs to make public
 * @param getToken - Token getter function
 */
const makePhotosPublic = async (
  userId: string,
  projectId: string,
  imageIds: string[],
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; inserted?: string[]; failed?: string[] }> => {
  try {
    const endPointUrl = `${API_BASE_URL}/makePhotosPublic`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        projectId: projectId,
        imageIds: imageIds,
      }),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Make photos public failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Make photos public failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Photos made public successfully:', data);
    return { success: true, msg: 'Successfully made photos public', inserted: data?.inserted };
  } catch (error) {
    console.error('Error making photos public:', error);
    return {
      success: false,
      msg: `Error making photos public: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * API call to make photos non-public.
 * @param userId - User ID
 * @param imageIds - Array of image IDs to make non-public
 * @param getToken - Token getter function
 */
const makePhotosNonPublic = async (
  userId: string,
  imageIds: string[],
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; deleted?: string[]; failed?: string[] }> => {
  try {
    const endPointUrl = `${API_BASE_URL}/makePhotosNonPublic`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        imageIds: imageIds,
      }),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Make photos non-public failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Make photos non-public failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Photos made non-public successfully:', data);
    return { success: true, msg: 'Successfully made photos non-public', deleted: data?.deleted };
  } catch (error) {
    console.error('Error making photos non-public:', error);
    return {
      success: false,
      msg: `Error making photos non-public: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * API call to fetch email addresses with photo access for a project.
 * @param projectId - Project ID
 * @param getToken - Token getter function
 */
const fetchEmailsWithPhotoAccess = async (
  projectId: string,
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; emails?: string[] }> => {
  try {
    const params = new URLSearchParams({
      projectId: projectId,
    }).toString();

    const endPointUrl = `${API_BASE_URL}/fetchEmailsWithPhotoAccess?${params}`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Fetch emails with photo access failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Fetch emails failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Emails with photo access retrieved successfully:', data);
    return { success: true, msg: 'Successfully retrieved emails', emails: data?.data || [] };
  } catch (error) {
    console.error('Error fetching emails with photo access:', error);
    return {
      success: false,
      msg: `Error fetching emails: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * API call to fetch public image IDs for a project.
 * @param projectId - Project ID
 * @param getToken - Token getter function
 */
const fetchProjectPublicImageIds = async (
  projectId: string,
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; imageIds?: string[] }> => {
  try {
    const params = new URLSearchParams({
      projectId: projectId,
    }).toString();

    const endPointUrl = `${API_BASE_URL}/fetchProjectPublicImageIds?${params}`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Fetch public image IDs failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Fetch public image IDs failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Public image IDs retrieved successfully:', data);
    return { success: true, msg: 'Successfully retrieved public image IDs', imageIds: data?.data || [] };
  } catch (error) {
    console.error('Error fetching public image IDs:', error);
    return {
      success: false,
      msg: `Error fetching public image IDs: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * Hook that provides a callback to delete media with background queuing.
 * All delete operations are queued for background processing to avoid making users wait.
 * If the media is in the mediaToUpload queue, it's removed from there without an API call.
 */
export const useDeleteMediaCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const addServerMediaToDeleteRecord = useAddServerMediaToDeleteCallback();
  const mediaToUpload = useAllMediaToUpload();

  return useCallback(
    async (
      projectId: string,
      imageIds: string[],
      imageType: string,
    ): Promise<{ success: boolean; msg: string }> => {
      if (!userId || !orgId) {
        return { success: false, msg: 'User ID or Organization ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      // First, check if any of these imageIds are in the mediaToUpload table
      // If they are, the caller should remove them from mediaToUpload (since they
      // were never uploaded to the server). We return the imageIds that need to be
      // removed so the caller can handle the cleanup.
      // Use Set for O(1) lookup performance
      const imageIdsSet = new Set(imageIds);
      const imagesInUploadQueue = mediaToUpload.filter((upload) => imageIdsSet.has(upload.itemId));

      if (imagesInUploadQueue.length > 0) {
        console.log(
          `Found ${imagesInUploadQueue.length} images in mediaToUpload queue. Caller should remove them.`,
        );
        // Return a special status indicating these images only need to be removed from the upload queue
        // The caller is responsible for removing them from mediaToUpload table
        return {
          success: true,
          msg: 'Images are queued for upload and should be removed from mediaToUpload (not uploaded to server yet)',
        };
      }

      // Always queue the delete for background processing to avoid making the user wait
      console.log(
        `Queuing delete for background processing - ${imageIds.length} images of type ${imageType}`,
      );
      const data = createServerMediaToDeleteData(orgId, projectId, imageIds, imageType);

      const result = addServerMediaToDeleteRecord(data);
      if (result.status === 'Success') {
        return {
          success: true,
          msg: 'Delete operation queued. Will be processed in the background.',
        };
      } else {
        return {
          success: false,
          msg: `Failed to queue delete operation: ${result.msg}`,
        };
      }
    },
    [userId, orgId, auth, addServerMediaToDeleteRecord, mediaToUpload],
  );
};

/**
 * Hook that provides a callback to duplicate a receipt image between projects.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useDuplicateReceiptImageCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (
      fromProjectId: string,
      toProjectId: string,
      imageId: string,
    ): Promise<{ success: boolean; msg: string; copiedBuckets?: string[] }> => {
      if (!userId || !orgId) {
        return { success: false, msg: 'User ID or Organization ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const duplicateResult = await duplicateReceiptImage(
          userId,
          orgId,
          fromProjectId,
          toProjectId,
          imageId,
          auth.getToken,
        );

        if (!duplicateResult.success) {
          console.log('Duplicate receipt image failed:', duplicateResult.msg);
          return {
            success: false,
            msg: `Duplicate receipt image failed: ${duplicateResult.msg}`,
          };
        }

        return duplicateResult;
      } catch (error) {
        console.error('Unexpected error in useDuplicateReceiptImageCallback:', error);

        return {
          success: false,
          msg: `Duplicate receipt image failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [userId, orgId, auth, isConnected, isInternetReachable],
  );
};

export const getLocalMediaFolder = (orgId: string, projectId: string, resourceType: resourceType): string => {
  const dir = new Directory(Paths.document, 'images', orgId, projectId, resourceType);
  return dir.uri;
};

const getLocalImageUri = (folder: string, id: string): string => {
  return `${folder}/${id}.jpeg`;
};

const getLocalVideoUri = (folder: string, id: string): string => {
  return `${folder}/${id}.mp4`;
};

export const buildLocalMediaUri = (
  orgId: string,
  projectId: string,
  imageId: string,
  type: mediaType,
  resourceType: resourceType,
): string => {
  const folder = getLocalMediaFolder(orgId, projectId, resourceType);
  if (type === 'video') {
    return getLocalVideoUri(folder, imageId);
  }

  return getLocalImageUri(folder, imageId);
};

/**
 * Deletes a local media file if it exists.
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param imageId - Image/video ID
 * @param type - Media type ('photo' or 'video')
 * @param resourceType - Resource type ('receipt', 'invoice', or 'photo')
 */
export const deleteLocalMediaFile = async (
  orgId: string,
  projectId: string,
  imageId: string,
  type: mediaType,
  resourceType: resourceType,
): Promise<void> => {
  try {
    const localUri = buildLocalMediaUri(orgId, projectId, imageId, type, resourceType);
    const file = new File(localUri);

    if (file.exists) {
      file.delete();
      console.log(`Deleted local media file: ${localUri}`);
    } else {
      console.log(`Local media file does not exist: ${localUri}`);
    }
  } catch (error) {
    console.error(`Error deleting local media file for ${imageId}:`, error);
    // Don't throw - we want deletion to continue even if file cleanup fails
  }
};

const copyToLocalFolder = async (
  imageUri: string,
  details: ImageDetails,
  mediaType: mediaType,
  resourceType: resourceType,
): Promise<ImageResult> => {
  // Copy to documents folder first.
  const destinationPath = getLocalMediaFolder(details.orgId, details.projectId, resourceType);
  let destinationUri: string;
  if (mediaType === 'video') {
    destinationUri = getLocalVideoUri(destinationPath, details.id);
  } else {
    destinationUri = getLocalImageUri(destinationPath, details.id);
  }

  let localImageUri = imageUri;

  try {
    // Request asset info to ensure we have permissions (especially on iOS)
    const phUri = imageUri.startsWith('ph://') ? imageUri.replace('ph://', '') : undefined;
    if (phUri) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          status: 'Error',
          id: details.id,
          msg: 'Media library permissions not granted',
        };
      } else {
        //console.log('Media library permissions granted');
      }

      const asset = await MediaLibrary.getAssetInfoAsync(phUri);
      if (asset.localUri) {
        localImageUri = asset.localUri;
        // console.log('Resolved ph:// URI to local URI:', localImageUri);
      } else {
        return {
          status: 'Error',
          id: details.id,
          msg: 'Could not resolve ph:// URI to local URI',
        };
      }
    }

    // Ensure directory exists
    const dir = new Directory(destinationPath);
    if (dir.exists === false) {
      // console.log(`Directory does not exist. Creating: ${destinationPath}`);
      dir.create({ intermediates: true, idempotent: true });
    }

    // Copy the file
    const sourceFile = new File(localImageUri);
    const destFile = new File(destinationUri);
    console.log(`Copying file from ${localImageUri} to ${destinationUri}`);

    sourceFile.copy(destFile);

    return {
      status: 'Success',
      id: details.id,
      uri: destinationUri,
      msg: `Successfully copied file to local app folder.`,
    };
  } catch (error) {
    console.error('Error copying file:', error);
    return {
      status: 'Error',
      id: details.id,
      msg: `Failed to copy file: ${error}`,
    };
  }
};

export const useAddImageCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const addMediaToUploadRecord = useAddMediaToUploadCallback();

  return useCallback(
    async (
      imageUri: string,
      projectId: string,
      mediaType: mediaType,
      resourceType: resourceType,
      deviceTypes: string = '',
    ): Promise<ImageResult> => {
      const id = randomUUID();
      console.log(
        `[useAddImageCallback] START - ID: ${id}, mediaType: ${mediaType}, resourceType: ${resourceType}`,
      );

      const latitude = 0;
      const longitude = 0;

      if (!userId || !orgId) {
        console.error('[useAddImageCallback] Missing userId or orgId', { userId, orgId });
        return { status: 'Error', id: id, msg: 'User ID or Organization ID not available' };
      }

      const details: ImageDetails = {
        id: id,
        userId: userId,
        orgId: orgId,
        projectId: projectId,
        longitude: longitude,
        latitude: latitude,
        deviceTypes: deviceTypes,
      };

      try {
        console.log(`[useAddImageCallback] Copying file locally for image ${id}`);
        const copyLocalResult = await copyToLocalFolder(imageUri, details, mediaType, resourceType);
        console.log(
          `[useAddImageCallback] Copy result - status: ${copyLocalResult.status}, uri: ${copyLocalResult.uri}`,
        );

        if (copyLocalResult.status !== 'Success' || !copyLocalResult.uri) {
          console.error(`[useAddImageCallback] Failed to copy image file:`, copyLocalResult.msg);
          return copyLocalResult;
        }

        // Always queue the upload for background processing to avoid making the user wait
        console.log(
          `[useAddImageCallback] Queuing upload for background processing - image ${id}, uri: ${copyLocalResult.uri}`,
        );
        const data: MediaToUploadData = {
          id: id,
          resourceType: resourceType,
          mediaType: mediaType,
          localUri: copyLocalResult.uri!,
          organizationId: orgId,
          projectId: projectId,
          itemId: id,
          uploadDate: Date.now(),
        };
        const result = addMediaToUploadRecord(data);
        console.log(`[useAddImageCallback] addMediaToUploadRecord result:`, result);

        if (result.status !== 'Success') {
          console.error(`[useAddImageCallback] Failed to add to upload queue:`, result.msg);
          return { status: 'Error', id: id, msg: `Failed to add upload to queue: ${result.msg}` };
        }

        console.log(
          `[useAddImageCallback] SUCCESS - Queued upload. Returning with uri: ${copyLocalResult.uri}`,
        );
        return {
          status: 'Success',
          id: id,
          uri: copyLocalResult.uri!,
          msg: 'File saved. Upload will be processed in the background.',
        };
      } catch (error) {
        console.error('[useAddImageCallback] Caught exception:', error);

        const localUri = buildLocalMediaUri(orgId, projectId, id, mediaType, resourceType);
        console.log(`[useAddImageCallback] Exception path - built localUri: ${localUri}`);

        const data: MediaToUploadData = {
          id: id,
          resourceType: resourceType,
          mediaType: mediaType,
          localUri: localUri,
          organizationId: orgId,
          projectId: projectId,
          itemId: id,
          uploadDate: Date.now(),
        };

        const errorMsg = formatErrorMessage(error);
        const result = addMediaToUploadRecord(data);
        console.log(`[useAddImageCallback] Exception path - addMediaToUploadRecord result:`, result);

        if (result.status === 'Success') {
          console.log(`[useAddImageCallback] SUCCESS - Queued upload in exception handler`);
          return {
            status: 'Success',
            id: id,
            msg: `File saved but upload failed due to error: ${errorMsg}. Will retry later.`,
          };
        } else {
          return {
            status: 'Error',
            id: id,
            msg: `Upload failed and could not add to retry queue: ${errorMsg}`,
          };
        }
      }
    },
    [userId, orgId, addMediaToUploadRecord, auth],
  );
};

export const useGetImageCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;

  return useCallback(
    async (
      projectId: string,
      itemId: string,
      resourceType: resourceType,
      deviceType: string = 'phone', // default to 'phone' as this will probably be 80% of the devices used.
    ): Promise<{ localUri: string; result: ImageResult }> => {
      if (!auth) {
        return { localUri: '', result: { status: 'Error', id: itemId, msg: 'Auth not available' } };
      }

      if (!userId || !orgId) {
        return {
          localUri: '',
          result: { status: 'Error', id: itemId, msg: 'User ID or Organization ID not available' },
        };
      }

      // First see if this image is found locally. If found return the local version.
      const path = getLocalMediaFolder(orgId, projectId, resourceType);
      const imageUri = getLocalImageUri(path, itemId);
      try {
        const file = new File(imageUri);
        if (file.exists) {
          return {
            localUri: imageUri,
            result: { status: 'Success', id: itemId, msg: 'Found on this device.' },
          };
        }

        // If not found locally, then download from server and return the local version.
        const details: ImageDetails = {
          id: itemId,
          userId: userId,
          orgId: orgId,
          projectId: projectId,
          longitude: 0,
          latitude: 0,
          deviceTypes: deviceType,
        };

        const downloadResult = await downloadImage(details, auth.getToken, resourceType, imageUri);

        return {
          localUri: imageUri,
          result: downloadResult,
        };
      } catch (error) {
        console.error('Error checking local file:', error);
        return {
          localUri: '',
          result: {
            status: 'Error',
            id: itemId,
            msg: `Error checking local file: ${error}`,
          },
        };
      }
    },
    [userId, orgId, auth],
  );
};

/**
 * Hook that provides a callback to make photos public for Owner to view.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useMakePhotosPublicCallback = () => {
  const auth = useAuth();
  const { userId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (projectId: string, imageIds: string[]): Promise<{ success: boolean; msg: string }> => {
      if (!userId) {
        return { success: false, msg: 'User ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const makePublicResult = await makePhotosPublic(userId, projectId, imageIds, auth.getToken);

        if (!makePublicResult.success) {
          console.log('Make public failed:', makePublicResult.msg);
          return {
            success: false,
            msg: `Make public failed: ${makePublicResult.msg}`,
          };
        }

        return makePublicResult;
      } catch (error) {
        console.error('Unexpected error in useMakePhotosPublicCallback:', error);

        return {
          success: false,
          msg: `Make public failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [userId, auth, isConnected, isInternetReachable],
  );
};

/**
 * Hook that provides a callback to make photos non-public.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useMakePhotosNonPublicCallback = () => {
  const auth = useAuth();
  const { userId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (imageIds: string[]): Promise<{ success: boolean; msg: string }> => {
      if (!userId) {
        return { success: false, msg: 'User ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const makeNonPublicResult = await makePhotosNonPublic(userId, imageIds, auth.getToken);

        if (!makeNonPublicResult.success) {
          console.log('Make non-public failed:', makeNonPublicResult.msg);
          return {
            success: false,
            msg: `Make non-public failed: ${makeNonPublicResult.msg}`,
          };
        }

        return makeNonPublicResult;
      } catch (error) {
        console.error('Unexpected error in useMakePhotosNonPublicCallback:', error);

        return {
          success: false,
          msg: `Make non-public failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [userId, auth, isConnected, isInternetReachable],
  );
};

/**
 * API call to grant a user access to view public photos in a specific project.
 * @param userId - User ID granting access
 * @param emailId - Email ID of the user being granted access
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param orgId - Organization ID
 * @param ownerName - Owner name from app settings
 * @param ownerEmail - Owner email from app settings
 * @param getToken - Token getter function
 */
const grantPhotoAccess = async (
  userId: string,
  emailId: string,
  projectId: string,
  projectName: string,
  orgId: string,
  fromName: string,
  fromEmail: string,
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string; data?: any }> => {
  try {
    const endPointUrl = `${API_BASE_URL}/grantPhotoAccess`;

    const requestBody = {
      userId: userId,
      emailId: emailId,
      projectId: projectId,
      projectName: projectName,
      orgId: orgId,
      fromName: fromName,
      fromEmail: fromEmail,
    };

    console.log('Grant photo access request body:', requestBody);

    const apiFetch = createApiWithToken(getToken);
    console.log(
      'Granting photo access from ',
      fromName,
      ' <',
      fromEmail,
      '> to ',
      emailId,
      ' for project ',
      projectName,
    );
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Grant photo access failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Grant photo access failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Photo access granted successfully:', data);
    return { success: true, msg: 'Successfully granted photo access', data: data?.data };
  } catch (error) {
    console.error('Error granting photo access:', error);
    return {
      success: false,
      msg: `Error granting photo access: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * Hook that provides a callback to grant photo access to a user.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useGrantPhotoAccessCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (
      emailId: string,
      projectId: string,
      projectName: string,
      fromName?: string,
      fromEmail?: string,
    ): Promise<{ success: boolean; msg: string; data?: any }> => {
      if (!userId || !orgId) {
        return { success: false, msg: 'User ID or Organization ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const grantAccessResult = await grantPhotoAccess(
          userId,
          emailId,
          projectId,
          projectName,
          orgId,
          fromName ?? '',
          fromEmail ?? '',
          auth.getToken,
        );

        if (!grantAccessResult.success) {
          console.log('Grant photo access failed:', grantAccessResult.msg);
          return {
            success: false,
            msg: `Grant photo access failed: ${grantAccessResult.msg}`,
          };
        }

        return grantAccessResult;
      } catch (error) {
        console.error('Unexpected error in useGrantPhotoAccessCallback:', error);

        return {
          success: false,
          msg: `Grant photo access failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [userId, orgId, auth, isConnected, isInternetReachable],
  );
};
/**
 * Hook that provides a callback to fetch emails with photo access for a project.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useFetchEmailsWithPhotoAccessCallback = () => {
  const auth = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (projectId: string): Promise<{ success: boolean; msg: string; emails?: string[] }> => {
      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const fetchResult = await fetchEmailsWithPhotoAccess(projectId, auth.getToken);

        if (!fetchResult.success) {
          console.log('Fetch emails with photo access failed:', fetchResult.msg);
          return {
            success: false,
            msg: `Fetch emails failed: ${fetchResult.msg}`,
          };
        }

        return fetchResult;
      } catch (error) {
        console.error('Unexpected error in useFetchEmailsWithPhotoAccessCallback:', error);

        return {
          success: false,
          msg: `Fetch emails failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [auth, isConnected, isInternetReachable],
  );
};

/**
 * API call to revoke photo access for a project.
 * @param userId - User ID
 * @param projectId - Project ID
 * @param getToken - Token getter function
 */
const revokePhotoAccess = async (
  userId: string,
  projectId: string,
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; msg: string }> => {
  try {
    const endPointUrl = `${API_BASE_URL}/revokePhotoAccess`;

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        projectId: projectId,
      }),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error('Revoke photo access failed. HTTP:', response.status, 'Body:', errorBody);
      return {
        success: false,
        msg: `Revoke photo access failed. HTTP ${response.status}. ${errorBody || 'No response body.'}`,
      };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // acceptable if no JSON body
    }

    console.log('Photo access revoked successfully:', data);
    return { success: true, msg: 'Successfully revoked photo access' };
  } catch (error) {
    console.error('Error revoking photo access:', error);
    return {
      success: false,
      msg: `Error revoking photo access: ${formatErrorMessage(error)}`,
    };
  }
};

/**
 * Hook that provides a callback to revoke photo access for a project.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useRevokePhotoAccessCallback = () => {
  const auth = useAuth();
  const { userId } = auth;
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (projectId: string): Promise<{ success: boolean; msg: string }> => {
      if (!userId) {
        return { success: false, msg: 'User ID not available' };
      }

      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const revokeResult = await revokePhotoAccess(userId, projectId, auth.getToken);

        if (!revokeResult.success) {
          console.log('Revoke photo access failed:', revokeResult.msg);
          return {
            success: false,
            msg: `Revoke photo access failed: ${revokeResult.msg}`,
          };
        }

        return revokeResult;
      } catch (error) {
        console.error('Unexpected error in useRevokePhotoAccessCallback:', error);

        return {
          success: false,
          msg: `Revoke photo access failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [userId, auth, isConnected, isInternetReachable],
  );
};

/**
 * Hook that provides a callback to fetch public image IDs for a project.
 * If offline, the request will fail.
 * If online, the request is executed immediately via the API.
 */
export const useFetchPublicImageIdsCallback = () => {
  const auth = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();

  return useCallback(
    async (projectId: string): Promise<{ success: boolean; msg: string; imageIds?: string[] }> => {
      if (!auth.getToken) {
        return { success: false, msg: 'Auth token getter not available' };
      }

      if (!isConnected || isInternetReachable === false) {
        return { success: false, msg: 'No network connection detected.' };
      }

      try {
        const fetchResult = await fetchProjectPublicImageIds(projectId, auth.getToken);

        if (!fetchResult.success) {
          console.log('Fetch public image IDs failed:', fetchResult.msg);
          return {
            success: false,
            msg: `Fetch public image IDs failed: ${fetchResult.msg}`,
          };
        }

        return fetchResult;
      } catch (error) {
        console.error('Unexpected error in useFetchPublicImageIdsCallback:', error);

        return {
          success: false,
          msg: `Fetch public image IDs failed with error: ${formatErrorMessage(error)}`,
        };
      }
    },
    [auth, isConnected, isInternetReachable],
  );
};
