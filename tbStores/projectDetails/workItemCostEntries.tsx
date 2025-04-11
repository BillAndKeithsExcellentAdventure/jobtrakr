import * as UiReact from 'tinybase/ui-react/with-schemas';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { TABLES_SCHEMA, getStoreId } from './ProjectDetailsStore';
import { NoValuesSchema } from 'tinybase/with-schemas';

const COSTS_TABLE = 'workItemCostEntries';

export interface WorkItemCostEntry {
  id: string;
  workItemId: string;
  vendor: string;
  itemDescription: string;
  amount: number;
  documentationType: string;
  documentationUri: string;
}

/**
 * Hook to retrieve all cost entries.
 */
export const useAllCostEntries = (projectId: string): WorkItemCostEntry[] => {
  const store = useStore(getStoreId(projectId));
  const [entries, setEntries] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    if (!store) return;

    const getEntries = () => {
      const table = store.getTable(COSTS_TABLE);
      return table
        ? Object.entries(table).map(([id, row]) => ({
            id,
            workItemId: row.workItemId ?? '',
            vendor: row.vendor ?? '',
            itemDescription: row.itemDescription ?? '',
            amount: row.amount ?? 0,
            documentationType: row.documentationType ?? '',
            documentationUri: row.documentationUri ?? '',
          }))
        : [];
    };

    setEntries(getEntries());

    const listenerId = store.addTableListener(COSTS_TABLE, () => {
      setEntries(getEntries());
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return entries;
};

/**
 * Hook to add a cost entry.
 */
export const useAddCostEntry = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (entry: Omit<WorkItemCostEntry, 'id'>) => {
      if (!store) return { status: 'Error', msg: 'Store not found', id: '' };

      const id = randomUUID();
      const newEntry: WorkItemCostEntry = { ...entry, id };

      const result = store.setRow(COSTS_TABLE, id, newEntry);
      return result
        ? { status: 'Success', msg: '', id }
        : { status: 'Error', msg: 'Failed to add entry', id: '' };
    },
    [store],
  );
};

/**
 * Hook to remove a cost entry.
 */
export const useDeleteCostEntry = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (id: string) => {
      if (!store) return { status: 'Error', msg: 'Store not found' };

      const result = store.delRow(COSTS_TABLE, id);
      return result
        ? { status: 'Success', msg: '' }
        : { status: 'Error', msg: `Failed to delete entry with id: ${id}` };
    },
    [store],
  );
};
