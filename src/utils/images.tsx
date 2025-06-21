import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FailedToUploadData, useAddItemCallback } from '@/src/tbStores/UploadSyncStore';

type ImageResult = { status: 'Success' | 'Error'; id: string; uri?: string | undefined; msg: string };

interface imageDetails {
  id: string;
  userId: string;
  orgId: string;
  projectId: string;
  longitude: number;
  latitude: number;
  deviceTypes: string;
}

const BACKEND_BASE_URL = 'https://projecthoundbackend.keith-m-bertram.workers.dev';

export type mediaType = 'photo' | 'video';
export type resourceType = 'receipt' | 'invoice' | 'photo';

const getAddImageEndPointUrl = (resourceType: resourceType, mediaType: mediaType) => {
  switch (resourceType) {
    case 'receipt':
      return `${BACKEND_BASE_URL}/addReceipt`;
    case 'invoice':
      return `${BACKEND_BASE_URL}/addInvoice`;
    case 'photo': {
      if (mediaType === 'video') {
        return `${BACKEND_BASE_URL}/addVideo`;
      }

      return `${BACKEND_BASE_URL}/addPhoto`;
    }
    default:
      throw new Error('Invalid resource type');
  }
};

const getFetchImageEndPointUrl = (resourceType: resourceType) => {
  switch (resourceType) {
    case 'receipt':
      return `${BACKEND_BASE_URL}/fetchReceipt`;
    case 'invoice':
      return `${BACKEND_BASE_URL}/fetchInvoice`;
    case 'photo':
      return `${BACKEND_BASE_URL}/fetchPhoto`;
    default:
      throw new Error('Invalid resource type');
  }
};

const downloadImage = async (
  details: imageDetails,
  token: string,
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

    // Make the API call
    const response = await fetch(endPointUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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

const uploadImage = async (
  details: imageDetails,
  token: string,
  mediaType: mediaType,
  resourceType: resourceType,
  localImageUrl: string,
): Promise<ImageResult> => {
  try {
    // Create FormData instance
    const formData = new FormData();

    // Add the text fields
    formData.append('id', details.id);
    formData.append('userId', details.userId);
    formData.append('organizationId', details.orgId);
    formData.append('projectId', details.projectId);
    formData.append('longitude', details.longitude.toString());
    formData.append('longitude', details.latitude.toString());
    formData.append('deviceTypes', details.deviceTypes);

    // Add the image file
    const uri = Platform.OS === 'ios' ? localImageUrl.replace('file://', '') : localImageUrl;
    const filename = localImageUrl.split('/').pop() || 'image.jpg';
    //    const match = /\.(\w+)$/.exec(filename);
    //    let type = match ? `image/${match[1]}` : 'image/jpeg';
    //    if (type === 'image/jpg') {
    //      type = 'image/jpeg'; // Normalize jpg to jpeg
    //    }

    let type = '';
    if (mediaType === 'video') {
      type = 'video/mp4'; // Ensure video type is set correctly
    } else if (mediaType === 'photo') {
      type = 'image/jpeg'; // Ensure photo type is set correctly
    }

    console.log('Uploading image type:', type);
    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const endPointUrl = getAddImageEndPointUrl(resourceType, mediaType);
    console.log('Uploading image to:', endPointUrl);

    const response = await fetch(endPointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data);
    return { status: 'Success', id: details.id, uri: localImageUrl, msg: 'Successfully uploaded image' };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
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
  details: imageDetails,
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
  const addFailedToUploadRecord = useAddItemCallback();

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

      const token = await auth.getToken();
      if (!token) {
        return { status: 'Error', id: id, msg: 'Auth token is not available.' };
      }

      // TODO: Get Lat/Long from imageUri or device location.
      const latitude = 0;
      const longitude = 0;

      const details: imageDetails = {
        id: id,
        userId: userId,
        orgId: orgId,
        projectId: projectId,
        longitude: longitude,
        latitude: latitude,
        deviceTypes: deviceTypes,
      };

      const copyLocalResult = await copyToLocalFolder(imageUri, details, mediaType, resourceType);
      if (copyLocalResult.status !== 'Success' || !copyLocalResult.uri) {
        return copyLocalResult;
      }

      // Upload to backend
      const uploadResult = await uploadImage(details, token, mediaType, resourceType, copyLocalResult.uri!);
      if (uploadResult.status !== 'Success') {
        const data: FailedToUploadData = {
          id: id,
          resourceType: resourceType,
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
          uploadResult.status = 'Success';
          uploadResult.msg = `File saved but unable upload to server. Will try later.`;
          uploadResult.id = id;
        }
      }

      return uploadResult;
    },
    [userId, orgId],
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

      const token = await auth.getToken();
      if (!token) {
        return { localUri: '', result: { status: 'Error', id: itemId, msg: 'Auth token is not available.' } };
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
        const details: imageDetails = {
          id: itemId,
          userId: userId,
          orgId: orgId,
          projectId: projectId,
          longitude: 0,
          latitude: 0,
          deviceTypes: deviceType,
        };

        const downloadResult = await downloadImage(details, token, resourceType, imageUri);

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
    [userId, orgId],
  );
};
