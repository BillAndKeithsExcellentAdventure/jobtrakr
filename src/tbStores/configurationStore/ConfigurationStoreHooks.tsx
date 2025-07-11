import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './ConfigurationStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useRowIds,
  useSetCellCallback,
  useSetValueCallback,
  useSortedRowIds,
  useStore,
  useRow,
  useTable,
  useValue,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { CrudResult } from '@/src/models/types';

export interface WorkCategoryData {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface WorkItemData {
  id: string;
  categoryId: string; // id of WorkCategoryData
  code: string;
  name: string;
  status: string;
}

export interface ProjectTemplateData {
  id: string;
  name: string;
  description: string;
}

export interface TemplateWorkItemData {
  id: string;
  templateId: string;
  workItemIds: string;
}

export interface VendorData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  mobilePhone?: string;
  businessPhone?: string;
  notes?: string;
}

export function WorkCategoryCodeCompareAsNumber(a: WorkCategoryData, b: WorkCategoryData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export function WorkItemDataCodeCompareAsNumber(a: WorkItemData, b: WorkItemData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export type CategorySchema = typeof TABLES_SCHEMA.categories;
export type WorkItemsSchema = typeof TABLES_SCHEMA.workItems;
export type TemplateSchema = typeof TABLES_SCHEMA.templates;
export type VendorsSchema = typeof TABLES_SCHEMA.vendors;

export type SchemaMap = {
  templates: TemplateSchema;
  categories: CategorySchema;
  workItems: WorkItemsSchema;
  vendors: VendorsSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  vendors: VendorData;
  templates: ProjectTemplateData;
  templateWorkItems: TemplateWorkItemData;
  categories: WorkCategoryData;
  workItems: WorkItemData;
};

export type CONFIGURATION_TABLES = keyof TableDataMap;

//  Extract table names and cell ID types
export type TableName = keyof typeof TABLES_SCHEMA;
export type CellIdMap = {
  [K in TableName]: keyof (typeof TABLES_SCHEMA)[K];
};

// --- Retrieve all rows of a table ---
export const useAllRows = <K extends keyof TableDataMap>(
  tableName: K,
  compareFn?: (a: TableDataMap[K], b: TableDataMap[K]) => number,
): TableDataMap[K][] => {
  const store = useStore(useStoreId());
  const [rows, setRows] = useState<TableDataMap[K][]>([]);

  const fetchRows = useCallback(() => {
    if (!store) return [];
    const table = store.getTable(tableName);
    const array = table
      ? (Object.entries(table).map(([id, row]) => ({
          ...row,
          id: id,
        })) as TableDataMap[K][])
      : [];
    if (!compareFn) return array;
    return array.sort(compareFn);
  }, [store, tableName]);

  useEffect(() => {
    setRows(fetchRows());
  }, [fetchRows]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener(tableName, () => setRows(fetchRows()));
    return () => {
      store.delListener(listenerId);
    };
  }, [store, tableName]);

  return rows;
};

// --- ADD ROW ---
export function useAddRowCallback<K extends CONFIGURATION_TABLES>(tableId: K) {
  const store = useStore(useStoreId());
  return useCallback(
    (data: TableDataMap[K]): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const id = randomUUID();
      const success = store.setRow(tableId, id, { ...data, id } as any);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to write' };
    },
    [store, tableId],
  );
}

// --- UPDATE ROW ---
export function useUpdateRowCallback<K extends CONFIGURATION_TABLES>(tableId: K) {
  const store = useStore(useStoreId());
  return useCallback(
    (id: string, updates: Partial<TableDataMap[K]>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const existing = store.getRow(tableId, id);
      if (!existing) return { status: 'Error', id: '0', msg: 'Row not found' };
      const success = store.setRow(tableId, id, { ...existing, ...updates });
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to update' };
    },
    [store, tableId],
  );
}

// --- DELETE ROW ---
export function useDeleteRowCallback<K extends CONFIGURATION_TABLES>(tableId: K) {
  const store = useStore(useStoreId());
  return useCallback(
    (id: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const success = store.delRow(tableId, id);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to delete' };
    },
    [store, tableId],
  );
}

// --- READ ROW ---
export function useTypedRow<K extends CONFIGURATION_TABLES>(
  tableId: K,
  id: string,
): (TableDataMap[K] & { id: string }) | undefined {
  const store = useStore(useStoreId());
  if (!store) return undefined;
  const row = store.getRow(tableId, id);
  if (!row) return undefined;
  return { id, ...row } as TableDataMap[K];
}

// --- VALUE HOOK ---
export const useTableValue = <T extends keyof SchemaMap, C extends Extract<keyof SchemaMap[T], string>>(
  tableId: T,
  rowId: string,
  cellId: C,
): Value<SchemaMap[T], C> => useCell(tableId, rowId, cellId, useStoreId()) as Value<SchemaMap[T], C>;

// --- HOOKS TO SET WORKITEMIDS FOR A TEMPLATE ---
export const useTemplateWorkItemData = (templateId: string) => {
  const [templateWorkItemData, setTemplateWorkItemData] = useState<TemplateWorkItemData | null>();
  const [templateWorkItemIds, setTemplateWorkItemIds] = useState<string[]>([]);
  let store = useStore(useStoreId());

  const fetchTemplateWorkItemData = useCallback((): TemplateWorkItemData | null => {
    if (!store) {
      return null;
    }

    const table = store.getTable('templateWorkItems');
    if (table) {
      const row = Object.entries(table).find(([id, row]) => row.templateId === templateId);
      if (row) {
        const [id, rowData] = row;
        return {
          id: id,
          templateId: rowData.templateId ?? '',
          workItemIds: rowData.workItemIds ?? '',
        } as TemplateWorkItemData;
      }
    }

    return null;
  }, [store, templateId]);

  useEffect(() => {
    setTemplateWorkItemData(fetchTemplateWorkItemData());
  }, [fetchTemplateWorkItemData]);

  // Function to handle table data change
  const handleTableChange = () => {
    setTemplateWorkItemData(fetchTemplateWorkItemData());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('templateWorkItems', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  useEffect(() => {
    if (templateWorkItemData) {
      const workItemIds =
        templateWorkItemData.workItemIds.length > 0 ? templateWorkItemData.workItemIds.split(',') : [];
      setTemplateWorkItemIds(workItemIds);
    }
  }, [templateWorkItemData]);

  const toggleWorkItemId = useCallback(
    (workItemId: string) => {
      if (workItemId === '') return;

      const updatedWorkItemIds = templateWorkItemIds.includes(workItemId)
        ? templateWorkItemIds.filter((id) => id !== workItemId) // remove the workItemId
        : templateWorkItemIds.length > 0
        ? [...templateWorkItemIds, workItemId]
        : [workItemId]; // add the workItemId

      // create a comma separated list of workItemIds
      const workItemIdsString = updatedWorkItemIds.length > 0 ? updatedWorkItemIds.join(',') : '';

      //update the store
      if (store) {
        store.setRow('templateWorkItems', templateId, {
          id: templateId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [templateWorkItemIds, store, templateId],
  );

  const setActiveWorkItemIds = useCallback(
    (workItemIds: string[]) => {
      const workItemIdsString = workItemIds.join(',');

      if (store) {
        store.setRow('templateWorkItems', templateId, {
          id: templateId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [store, templateId],
  );

  return { templateWorkItemIds, toggleWorkItemId, setActiveWorkItemIds }; // Return the template work item data or null if not found
};
