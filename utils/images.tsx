import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FailedToUploadData, useAddItemCallback } from '@/tbStores/UploadSyncStore';

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

export type resourceType = 'receipt' | 'invoice' | 'photo';

const getAddImageEndPointUrl = (resourceType: resourceType) => {
  switch (resourceType) {
    case 'receipt':
      return `${BACKEND_BASE_URL}/addReceipt`;
    case 'invoice':
      return `${BACKEND_BASE_URL}/addInvoice`;
    case 'photo':
      return `${BACKEND_BASE_URL}/addPhoto`;
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
    const requestBody = {
      userId: details.userId,
      projectId: details.projectId,
      organizationId: details.orgId,
      imageId: details.id,
    };

    const endPointUrl = getFetchImageEndPointUrl(resourceType);

    // Make the API call
    const response = await fetch(endPointUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the image data as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert arrayBuffer to base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

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

const uploadImage = async (
  details: imageDetails,
  token: string,
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
    const match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : 'image/jpeg';
    if (type === 'image/jpg') {
      type = 'image/jpeg'; // Normalize jpg to jpeg
    }

    console.log('Uploading image type:', type);
    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const endPointUrl = getAddImageEndPointUrl(resourceType);
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

const getLocalImageFolder = (orgId: string, projectId: string, resourceType: resourceType): string => {
  return `${FileSystem.documentDirectory}/images/${orgId}/${projectId}/${resourceType}`;
};

const getLocalImageUri = (folder: string, id: string): string => {
  return `${folder}/${id}.jpeg`;
};

const copyToLocalFolder = async (
  imageUri: string,
  details: imageDetails,
  resourceType: resourceType,
): Promise<ImageResult> => {
  // Copy to documents folder first.
  const destinationPath = getLocalImageFolder(details.orgId, details.projectId, resourceType);
  const destinationUri = getLocalImageUri(destinationPath, details.id);

  try {
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(destinationPath, { intermediates: true });

    // Copy the file
    await FileSystem.copyAsync({
      from: imageUri,
      to: destinationUri,
    });

    console.log(`File copied successfully to ${destinationUri}`);

    // Update imageUri to use the new location
    imageUri = destinationUri;

    return {
      status: 'Success',
      id: details.id,
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

      const copyLocalResult = await copyToLocalFolder(imageUri, details, resourceType);
      if (copyLocalResult.status !== 'Success') {
        return copyLocalResult;
      }

      // Upload to backend
      const uploadResult = await uploadImage(details, token, resourceType, imageUri);
      if (uploadResult.status !== 'Success') {
        const data: FailedToUploadData = {
          id: id,
          resourceType: resourceType,
          localUri: imageUri,
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
      const path = getLocalImageFolder(orgId, projectId, resourceType);
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
