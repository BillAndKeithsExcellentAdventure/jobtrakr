import { useCallback, useEffect, useState } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { getStoreId, TABLES_SCHEMA } from './ProjectDetailsStore';
import { NoValuesSchema } from 'tinybase/with-schemas';
import { randomUUID } from 'expo-crypto';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const SUMMARY_TABLE = 'workItemSummary';

export interface WorkItemSummary {
  id: string;
  workItemId: string;
  bidAmount: number;
  spentAmount: number;
}

/**
 * Hook to retrieve all summaries.
 */
export const useAllWorkItemSummaries = (projectId: string): WorkItemSummary[] => {
  const store = useStore(getStoreId(projectId));
  const [items, setItems] = useState<WorkItemSummary[]>([]);

  useEffect(() => {
    if (!store) return;

    const getSummaries = () => {
      const table = store.getTable(SUMMARY_TABLE);
      return table
        ? Object.entries(table).map(([id, row]) => ({
            id,
            workItemId: row.workItemId ?? '',
            bidAmount: row.bidAmount ?? 0,
            spentAmount: row.spentAmount ?? 0,
          }))
        : [];
    };

    setItems(getSummaries());

    const listenerId = store.addTableListener(SUMMARY_TABLE, () => {
      setItems(getSummaries());
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return items;
};

/**
 * Hook to add a summary.
 */
export const useAddWorkItemSummary = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (entry: Omit<WorkItemSummary, 'id'>) => {
      if (!store) return { status: 'Error', msg: 'Store not found', id: '' };

      const id = randomUUID();
      const newEntry: WorkItemSummary = { ...entry, id };

      const result = store.setRow(SUMMARY_TABLE, id, newEntry);
      return result
        ? { status: 'Success', msg: '', id }
        : { status: 'Error', msg: 'Failed to add entry', id: '' };
    },
    [store],
  );
};

/**
 * Hook to update a summary.
 */
export const useUpdateWorkItemSummary = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (data: WorkItemSummary) => {
      if (!store) return { status: 'Error', msg: 'Store not found' };

      const result = store.setRow(SUMMARY_TABLE, data.id, data);
      return result ? { status: 'Success', msg: '' } : { status: 'Error', msg: 'Failed to update summary' };
    },
    [store],
  );
};

/**
 * Hook to delete a summary.
 */
export const useDeleteWorkItemSummary = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (id: string) => {
      if (!store) return { status: 'Error', msg: 'Store not found' };

      const result = store.delRow(SUMMARY_TABLE, id);
      return result
        ? { status: 'Success', msg: '' }
        : { status: 'Error', msg: `Failed to delete summary with id: ${id}` };
    },
    [store],
  );
};
