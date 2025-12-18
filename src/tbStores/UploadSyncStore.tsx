import { useCallback, useEffect, useMemo, useState } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { TBStatus } from '@/src/models/types';
import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';

//export type mediaType = 'photo' | 'video';
// export type resourceType = 'receipt' | 'invoice' | 'photo';

export interface FailedToUploadData {
  id: string;
  mediaType: string;
  resourceType: string;
  organizationId: string;
  projectId: string;
  itemId: string;
  localUri: string;
  uploadDate: number;
}

export interface FailedToDeleteData {
  id: string;
  organizationId: string;
  projectId: string;
  imageIds: string;
  imageType: string;
  deleteDate: number;
}

export const STORE_ID_PREFIX = 'PHV1_FailedToUploadSyncStore';
export const TABLES_SCHEMA = {
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
  failedToDelete: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    projectId: { type: 'string' },
    imageIds: { type: 'string' },
    imageType: { type: 'string' },
    deleteDate: { type: 'number' },
  },
} as const;

const { useCreateMergeableStore, useDelRowCallback, useProvideStore, useStore: useStoreInternal } =
  UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreIdInternal = () => {
  const { userId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${userId}`, [userId]);
  return storeId;
};

// Export for use in components
export const useUploadSyncStoreId = useStoreIdInternal;
export const useUploadSyncStore = () => useStoreInternal(useStoreIdInternal());

/**
 * Returns all failed upload items for the current store ID.
 */
export const useAllFailedToUpload = () => {
  const [allItems, setAllItems] = useState<FailedToUploadData[]>([]);
  let store = useStoreInternal(useStoreIdInternal());

  const fetchAllFailedToUploadItems = useCallback((): FailedToUploadData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('failedToUpload');
    if (table) {
      const items: FailedToUploadData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        mediaType: row.mediaType ?? '',
        resourceType: row.resourceType ?? '',
        localUri: row.localUri ?? '',
        organizationId: row.organizationId ?? '',
        projectId: row.projectId ?? '',
        itemId: row.itemId ?? '',
        uploadDate: row.uploadDate ?? 0,
      }));
      console.log(`Fetched ${items.length} failed to upload items`);
      return [...items].sort((a, b) => (b.uploadDate ?? 0) - (a.uploadDate ?? 0));
    }
    return [];
  }, [store]);

  useEffect(() => {
    setAllItems(fetchAllFailedToUploadItems());
  }, [fetchAllFailedToUploadItems]);

  // Function to handle table data change
  const handleTableChange = useCallback(() => {
    setAllItems(fetchAllFailedToUploadItems());
  }, [fetchAllFailedToUploadItems]);

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('failedToUpload', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store, handleTableChange]);

  return allItems;
};

// Returns a callback that adds a new failed upload entry to the store.
export const useAddFailedToUploadMediaCallback = () => {
  let store = useStoreInternal(useStoreIdInternal());

  return useCallback(
    (failedToUploadData: FailedToUploadData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      failedToUploadData.id = id;
      console.log('Adding failed to upload media with ID:', id);
      if (store) {
        const storeCheck = store.setRow('failedToUpload', id, failedToUploadData);
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
export const useDeleteFailedToUploadCallback = (id: string) =>
  useDelRowCallback('failedToUpload', id, useStoreIdInternal());

/**
 * Returns all failed delete operations for the current store ID.
 */
export const useAllFailedToDelete = () => {
  const [allItems, setAllItems] = useState<FailedToDeleteData[]>([]);
  let store = useStoreInternal(useStoreIdInternal());

  const fetchAllFailedToDeleteItems = useCallback((): FailedToDeleteData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('failedToDelete');
    if (table) {
      const items: FailedToDeleteData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        organizationId: row.organizationId ?? '',
        projectId: row.projectId ?? '',
        imageIds: row.imageIds ?? '',
        imageType: row.imageType ?? '',
        deleteDate: row.deleteDate ?? 0,
      }));
      console.log(`Fetched ${items.length} failed to delete items`);
      return [...items].sort((a, b) => (b.deleteDate ?? 0) - (a.deleteDate ?? 0));
    }
    return [];
  }, [store]);

  useEffect(() => {
    setAllItems(fetchAllFailedToDeleteItems());
  }, [fetchAllFailedToDeleteItems]);

  // Function to handle table data change
  const handleTableChange = useCallback(() => {
    setAllItems(fetchAllFailedToDeleteItems());
  }, [fetchAllFailedToDeleteItems]);

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('failedToDelete', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store, handleTableChange]);

  return allItems;
};

// Returns a callback that adds a new failed delete operation to the store.
export const useAddFailedToDeleteCallback = () => {
  let store = useStoreInternal(useStoreIdInternal());

  return useCallback(
    (failedToDeleteData: FailedToDeleteData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      failedToDeleteData.id = id;
      console.log('Adding failed to delete media with ID:', id);
      if (store) {
        const storeCheck = store.setRow('failedToDelete', id, failedToDeleteData);
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

// Returns a callback that deletes a failed delete entry from the store.
export const useDeleteFailedToDeleteCallback = (id: string) =>
  useDelRowCallback('failedToDelete', id, useStoreIdInternal());

// Create, persist, and sync a store containing upload/delete sync data
export default function FailedToUploadSyncStore() {
  const storeId = useStoreIdInternal();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);

  // We do NOT want to synchronize this store with the cloud server.

  useProvideStore(storeId, store);

  return null;
}
