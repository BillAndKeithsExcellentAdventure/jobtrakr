import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { FailedToUploadData, useAddFailedToUploadMediaCallback } from '@/src/tbStores/UploadSyncStore';
import { API_BASE_URL } from '../constants/app-constants';
import { useAuthToken } from '../context/AuthTokenContext';
import { useNetwork } from '../context/NetworkContext';
import { createApiWithRetry } from './apiWithTokenRefresh';

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

const getFetchImageEndPointUrl = (resourceType: resourceType) => {
  switch (resourceType) {
    case 'receipt':
      return `${API_BASE_URL}/fetchReceipt`;
    case 'invoice':
      return `${API_BASE_URL}/fetchInvoice`;
    case 'photo':
      return `${API_BASE_URL}/fetchPhoto`;
    default:
      throw new Error('Invalid resource type');
  }
};

const downloadImage = async (
  details: ImageDetails,
  token: string | null,
  refreshToken: () => Promise<string | null>,
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
    const apiFetch = createApiWithRetry(token, refreshToken);
    const response = await apiFetch(endPointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Image download response:', JSON.stringify(response));
    // Get the image data as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('Image download arrayBuffer.byteLength:', arrayBuffer.byteLength);

    // Convert arrayBuffer to base64 using Expo FileSystem
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Data = arrayBufferToBase64(uint8Array);
    console.log('Image download base64Data.length:', base64Data.length);

    // Ensure directory exists
    const directory = localUri.substring(0, localUri.lastIndexOf('/'));
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

    // Write the base64 data to file
    await FileSystem.writeAsStringAsync(localUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

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
    formData.append('latitude', details.latitude.toString()); // fixed duplicate key
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
  token: string | null,
  refreshToken: () => Promise<string | null>,
) => {
  try {
    const endPointUrl = `${API_BASE_URL}/deleteMedia`;

    // Make the API call with token refresh
    const apiFetch = createApiWithRetry(token, refreshToken);
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

const getLocalMediaFolder = (orgId: string, projectId: string, resourceType: resourceType): string => {
  return `${FileSystem.documentDirectory}/images/${orgId}/${projectId}/${resourceType}`;
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

  try {
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(destinationPath, { intermediates: true });

    // Copy the file
    await FileSystem.copyAsync({
      from: imageUri,
      to: destinationUri,
    });

    // Update imageUri to use the new location
    imageUri = destinationUri;

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
  const { token, refreshToken } = useAuthToken();
  const { isConnected, isInternetReachable } = useNetwork();
  const addFailedToUploadRecord = useAddFailedToUploadMediaCallback();

  return useCallback(
    async (
      imageUri: string,
      projectId: string,
      mediaType: mediaType,
      resourceType: resourceType,
      deviceTypes: string = '',
    ): Promise<ImageResult> => {
      const id = randomUUID();

      if (!auth) {
        return { status: 'Error', id: id, msg: 'Auth not available' };
      }

      if (!userId || !orgId) {
        return { status: 'Error', id: id, msg: 'User ID or Organization ID not available' };
      }

      // TODO: Get Lat/Long from imageUri or device location.
      const latitude = 0;
      const longitude = 0;

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
        const copyLocalResult = await copyToLocalFolder(imageUri, details, mediaType, resourceType);
        if (copyLocalResult.status !== 'Success' || !copyLocalResult.uri) {
          return copyLocalResult;
        }

        // Check network connectivity before attempting upload
        // If offline, queue the upload without attempting the network call
        if (!isConnected || isInternetReachable === false) {
          console.log(
            'No network connection detected. Queuing upload without attempting network call to save battery.',
          );
          const data: FailedToUploadData = {
            id: id,
            resourceType: resourceType,
            mediaType: mediaType,
            localUri: copyLocalResult.uri!,
            organizationId: orgId,
            projectId: projectId,
            itemId: id,
            uploadDate: Date.now(),
          };
          const result = addFailedToUploadRecord(data);
          if (result.status !== 'Success') {
            return { status: 'Error', id: id, msg: `Failed to add upload to queue: ${result.msg}` };
          }
          return {
            status: 'Success',
            id: id,
            msg: 'File saved. Will upload when internet connection is available.',
          };
        }

        // Upload to backend with token refresh
        const uploadResult = await uploadImage(
          details,
          token,
          refreshToken,
          mediaType,
          resourceType,
          copyLocalResult.uri!,
        );
        if (uploadResult.status !== 'Success') {
          const data: FailedToUploadData = {
            id: id,
            resourceType: resourceType,
            mediaType: mediaType,
            localUri: copyLocalResult.uri!,
            organizationId: orgId,
            projectId: projectId,
            itemId: id,
            uploadDate: Date.now(),
          };
          const result = addFailedToUploadRecord(data);
          if (result.status !== 'Success') {
            return { status: 'Error', id: id, msg: `Failed to add failed upload record: ${result.msg}` };
          } else {
            // Return a new success result indicating file will be retried
            return {
              status: 'Success',
              id: id,
              msg: 'File saved but unable upload to server. Will try later.',
            };
          }
        }

        return uploadResult;
      } catch (error) {
        // Catch any unexpected errors and ensure they get added to failedToUpload
        console.error('Unexpected error in useAddImageCallback:', error);
        
        // Try to determine if file was copied locally
        const localUri = buildLocalMediaUri(orgId, projectId, id, mediaType, resourceType);
        
        // Add to failed upload queue
        const data: FailedToUploadData = {
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
        const result = addFailedToUploadRecord(data);
        if (result.status === 'Success') {
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
    [userId, orgId, token, refreshToken, addFailedToUploadRecord, auth, isConnected, isInternetReachable],
  );
};

export const useGetImageCallback = () => {
  const auth = useAuth();
  const { userId, orgId } = auth;
  const { token, refreshToken } = useAuthToken();

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
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
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

        const downloadResult = await downloadImage(details, token, refreshToken, resourceType, imageUri);

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
    [userId, orgId, token, refreshToken, auth],
  );
};
