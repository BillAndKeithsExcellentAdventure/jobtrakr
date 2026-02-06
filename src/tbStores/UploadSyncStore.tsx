import { useCallback, useEffect, useMemo, useState } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { TBStatus } from '@/src/models/types';
import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';

//export type mediaType = 'photo' | 'video';
// export type resourceType = 'receipt' | 'invoice' | 'photo';

export interface MediaToUploadData {
  id: string;
  mediaType: string;
  resourceType: string;
  organizationId: string;
  projectId: string;
  itemId: string;
  localUri: string;
  uploadDate: number;
}

export interface ServerMediaToDeleteData {
  id: string;
  organizationId: string;
  projectId: string;
  imageIds: string;
  imageType: string;
  deleteDate: number;
}

export const STORE_ID_PREFIX = 'PHV1_MediaUploadSyncStore';
export const TABLES_SCHEMA = {
  mediaToUpload: {
    id: { type: 'string' },
    mediaType: { type: 'string' },
    resourceType: { type: 'string' },
    organizationId: { type: 'string' },
    projectId: { type: 'string' },
    itemId: { type: 'string' },
    localUri: { type: 'string' },
    uploadDate: { type: 'number' },
  },
  serverMediaToDelete: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    projectId: { type: 'string' },
    imageIds: { type: 'string' },
    imageType: { type: 'string' },
    deleteDate: { type: 'number' },
  },
} as const;

const {
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useStore: useStoreInternal,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreIdInternal = () => {
  const { userId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${userId}`, [userId]);
  return storeId;
};

// Export for use in components
export const useUploadSyncStoreId = useStoreIdInternal;
export const useUploadSyncStore = () => useStoreInternal(useStoreIdInternal());

/**
 * Returns all media items queued for upload for the current store ID.
 */
export const useAllMediaToUpload = () => {
  const [allItems, setAllItems] = useState<MediaToUploadData[]>([]);
  let store = useStoreInternal(useStoreIdInternal());

  const fetchAllMediaToUploadItems = useCallback((): MediaToUploadData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('mediaToUpload');
    if (table) {
      const items: MediaToUploadData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        mediaType: row.mediaType ?? '',
        resourceType: row.resourceType ?? '',
        localUri: row.localUri ?? '',
        organizationId: row.organizationId ?? '',
        projectId: row.projectId ?? '',
        itemId: row.itemId ?? '',
        uploadDate: row.uploadDate ?? 0,
      }));
      if (items.length > 0) {
        console.log(`Fetched ${items.length} media items queued for upload`);
      }
      return [...items].sort((a, b) => (b.uploadDate ?? 0) - (a.uploadDate ?? 0));
    }
    return [];
  }, [store]);

  useEffect(() => {
    setAllItems(fetchAllMediaToUploadItems());
  }, [fetchAllMediaToUploadItems]);

  // Function to handle table data change
  const handleTableChange = useCallback(() => {
    setAllItems(fetchAllMediaToUploadItems());
  }, [fetchAllMediaToUploadItems]);

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('mediaToUpload', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store, handleTableChange]);

  return allItems;
};

// Returns a callback that adds a new media upload entry to the store.
export const useAddMediaToUploadCallback = () => {
  let store = useStoreInternal(useStoreIdInternal());

  return useCallback(
    (mediaToUploadData: MediaToUploadData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      mediaToUploadData.id = id;
      console.log('Adding media to upload queue with ID:', id);
      if (store) {
        const storeCheck = store.setRow('mediaToUpload', id, mediaToUploadData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that deletes an entry from the store.
export const useDeleteMediaToUploadCallback = (id: string) =>
  useDelRowCallback('mediaToUpload', id, useStoreIdInternal());

/**
 * Returns all server media delete operations queued for the current store ID.
 */
export const useAllServerMediaToDelete = () => {
  const [allItems, setAllItems] = useState<ServerMediaToDeleteData[]>([]);
  let store = useStoreInternal(useStoreIdInternal());

  const fetchAllServerMediaToDeleteItems = useCallback((): ServerMediaToDeleteData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('serverMediaToDelete');
    if (table) {
      const items: ServerMediaToDeleteData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        organizationId: row.organizationId ?? '',
        projectId: row.projectId ?? '',
        imageIds: row.imageIds ?? '',
        imageType: row.imageType ?? '',
        deleteDate: row.deleteDate ?? 0,
      }));
      console.log(`Fetched ${items.length} server media items queued for deletion`);
      return [...items].sort((a, b) => (b.deleteDate ?? 0) - (a.deleteDate ?? 0));
    }
    return [];
  }, [store]);

  useEffect(() => {
    setAllItems(fetchAllServerMediaToDeleteItems());
  }, [fetchAllServerMediaToDeleteItems]);

  // Function to handle table data change
  const handleTableChange = useCallback(() => {
    setAllItems(fetchAllServerMediaToDeleteItems());
  }, [fetchAllServerMediaToDeleteItems]);

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('serverMediaToDelete', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store, handleTableChange]);

  return allItems;
};

// Returns a callback that adds a new server media delete operation to the store.
export const useAddServerMediaToDeleteCallback = () => {
  let store = useStoreInternal(useStoreIdInternal());

  return useCallback(
    (serverMediaToDeleteData: ServerMediaToDeleteData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      serverMediaToDeleteData.id = id;
      console.log('Adding server media to delete queue with ID:', id);
      if (store) {
        const storeCheck = store.setRow('serverMediaToDelete', id, serverMediaToDeleteData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that deletes a server media delete entry from the store.
export const useDeleteServerMediaToDeleteCallback = (id: string) =>
  useDelRowCallback('serverMediaToDelete', id, useStoreIdInternal());

// Create, persist, and sync a store containing upload/delete sync data
export default function MediaUploadSyncStore() {
  const storeId = useStoreIdInternal();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);

  // We do NOT want to synchronize this store with the cloud server.

  useProvideStore(storeId, store);

  return null;
}
