import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, createStore, NoValuesSchema, Value } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { TBStatus } from '@/src/models/types';
import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';

export interface FailedToUploadData {
  id: string;
  resourceType: string;
  organizationId: string;
  projectId: string;
  itemId: string;
  localUri: string;
  uploadDate: number;
}

const STORE_ID_PREFIX = 'PHV1_FailedToUploadSyncStore';
const TABLES_SCHEMA = {
  failedToUpload: {
    id: { type: 'string' },
    resourceType: { type: 'string' },
    organizationId: { type: 'string' },
    projectId: { type: 'string' },
    itemId: { type: 'string' },
    localUri: { type: 'string' },
    uploadDate: { type: 'number' },
  },
} as const;

type FailedToUploadSchema = typeof TABLES_SCHEMA.failedToUpload;
type FailedToUploadCellId = keyof (typeof TABLES_SCHEMA)['failedToUpload'];

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useRowIds,
  useSetCellCallback,
  useSortedRowIds,
  useStore,
  useTable,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => {
  const { userId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${userId}`, [userId]);
  return storeId;
};

/**
 * Returns all projects for the current store ID.
 */
export const useAllFailedToUpload = () => {
  const [allItems, setAllItems] = useState<FailedToUploadData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllFailedToUploadItems = useCallback((): FailedToUploadData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('failedToUpload');
    if (table) {
      const items: FailedToUploadData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        resourceType: row.resourceType ?? '',
        localUri: row.localUri ?? '',
        organizationId: row.organizationId ?? '',
        projectId: row.projectId ?? '',
        itemId: row.itemId ?? '',
        uploadDate: row.uploadDate ?? 0,
      }));

      return items.sort((a, b) => (b.uploadDate ?? 0) - (a.uploadDate ?? 0));
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllItems(fetchAllFailedToUploadItems());
  }, [fetchAllFailedToUploadItems]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllItems(fetchAllFailedToUploadItems());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('failedToUpload', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return allItems;
};

// Returns a callback that adds a new project to the store.
export const useAddItemCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (failedToUploadData: FailedToUploadData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      failedToUploadData.id = id;

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

// Returns a callback that deletes a project from the store.
export const useDeleteFailedToUploadCallback = (id: string) =>
  useDelRowCallback('failedToUpload', id, useStoreId());

// Create, persist, and sync a store containing the IDs of the projects
export default function FailedToUploadSyncStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);

  // We do NOT want to synchronize this store with the cloud server.

  useProvideStore(storeId, store);

  return null;
}
