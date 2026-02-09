import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './ConfigurationStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { CrudResult } from '@/src/models/types';
import { exportTinyBaseStore, importFromJson } from '@/src/utils/tinybase-json';

const { useCell, useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export interface WorkCategoryData {
  id: string;
  code: string;
  name: string;
  status: string;
  hidden?: boolean;
}

export interface WorkItemData {
  id: string;
  categoryId: string; // id of WorkCategoryData
  code: string;
  name: string;
  status: string;
  hidden?: boolean;
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
  accountingId: string; // QuickBooks Vendor Id
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  mobilePhone?: string;
  businessPhone?: string;
  notes?: string;
}

export interface AccountData {
  id: string;
  accountingId: string; // QuickBooks Account Id
  name: string;
  accountType: string; // e.g., 'Expense', 'Bank', 'Credit Card', 'Other Current Asset'
  accountSubType: string; // e.g., 'Checking', 'CreditCard',
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
export type AccountsSchema = typeof TABLES_SCHEMA.accounts;

export type SchemaMap = {
  templates: TemplateSchema;
  categories: CategorySchema;
  workItems: WorkItemsSchema;
  vendors: VendorsSchema;
  accounts: AccountsSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  vendors: VendorData;
  templates: ProjectTemplateData;
  templateWorkItems: TemplateWorkItemData;
  categories: WorkCategoryData;
  workItems: WorkItemData;
  accounts: AccountData;
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
    return [...array].sort(compareFn);
  }, [store, tableName, compareFn]);
  useEffect(() => {
    setRows(fetchRows());
  }, [fetchRows]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener(tableName, () => setRows(fetchRows()));
    return () => {
      store.delListener(listenerId);
    };
  }, [store, tableName, fetchRows]);

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
    // allowDelete indicates whether to hard delete or just mark as hidden - allowDelete is only
    // applicable when there are not projects in the list of projects store
    (id: string, allowDelete = false): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      // if deleting a category, mark the category as hidden and then mark any workItems that reference this categoryId as hidden
      if (tableId === 'categories') {
        const category = store.getRow('categories', id);
        if (category) {
          if (!allowDelete) {
            store.setRow('categories', id, { ...category, hidden: true });
          } else {
            store.delRow('categories', id);
          }

          const workItemsTable = store.getTable('workItems') || {};
          for (const [workItemId, workItem] of Object.entries(workItemsTable)) {
            if (workItem.categoryId === id) {
              if (!allowDelete) {
                store.setRow('workItems', workItemId, { ...workItem, hidden: true });
              } else {
                store.delRow('workItems', workItemId);
              }
            }

            // remove the workItemId from any TemplateWorkItemData entries
            const templateWorkItemsTable = store.getTable('templateWorkItems') || {};
            for (const [templateId, templateWorkItem] of Object.entries(templateWorkItemsTable)) {
              const workItemIds = templateWorkItem.workItemIds
                ? templateWorkItem.workItemIds.split(',').filter((wid) => wid !== workItemId)
                : [];
              store.setRow('templateWorkItems', templateId, {
                ...templateWorkItem,
                workItemIds: workItemIds.join(','),
              });
            }
          }
        }
        return { status: 'Success', id, msg: '' };
      }

      // if deleting a workItem, mark the workItem as hidden
      if (tableId === 'workItems') {
        const workItem = store.getRow('workItems', id);
        if (workItem) {
          if (!allowDelete) {
            store.setRow('workItems', id, { ...workItem, hidden: true });
          } else {
            store.delRow('workItems', id);
          }

          // remove the workItemId from any TemplateWorkItemData entries
          const templateWorkItemsTable = store.getTable('templateWorkItems') || {};
          for (const [templateId, templateWorkItem] of Object.entries(templateWorkItemsTable)) {
            const workItemIds = templateWorkItem.workItemIds
              ? templateWorkItem.workItemIds.split(',').filter((wid) => wid !== id)
              : [];
            store.setRow('templateWorkItems', templateId, {
              ...templateWorkItem,
              workItemIds: workItemIds.join(','),
            });
          }
        }
        return { status: 'Success', id, msg: '' };
      }

      // For other tables, perform actual deletion
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
  const [templateWorkCategoryIds, setTemplateWorkCategoryIds] = useState<string[]>([]);
  let store = useStore(useStoreId());
  const allWorkItems = useAllRows('workItems');

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
  const handleTableChange = useCallback(() => {
    setTemplateWorkItemData(fetchTemplateWorkItemData());
  }, [fetchTemplateWorkItemData]);

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('templateWorkItems', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, [store, handleTableChange]);

  useEffect(() => {
    if (templateWorkItemData) {
      const workItemIds =
        templateWorkItemData.workItemIds.length > 0 ? templateWorkItemData.workItemIds.split(',') : [];
      setTemplateWorkItemIds(workItemIds);
    }
  }, [templateWorkItemData, setTemplateWorkItemIds]);

  useEffect(() => {
    if (templateWorkItemIds.length > 0) {
      const categoryIds = new Set<string>();
      for (const workItemId of templateWorkItemIds) {
        const workItem = allWorkItems.find((w) => w.id === workItemId);
        if (workItem) {
          categoryIds.add(workItem.categoryId);
        }
      }
      setTemplateWorkCategoryIds(Array.from(categoryIds));
    } else {
      setTemplateWorkCategoryIds([]); // Reset categories when work items change
    }
  }, [templateWorkItemIds, allWorkItems, setTemplateWorkCategoryIds]);

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

  return { templateWorkItemIds, toggleWorkItemId, setActiveWorkItemIds, templateWorkCategoryIds }; // Return the template work item data or null if not found
};

export function useExportStoreDataCallback() {
  const store = useStore(useStoreId());
  return useCallback((): any => {
    if (!store) return null;
    return exportTinyBaseStore(store);
  }, [store]);
}

export function useImportJsonConfigurationDataCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (jsonData: any): any => {
      if (!store) return null;
      importFromJson(store, jsonData);
    },
    [store],
  );
}

// Create a function that would look for workItems that have no matching categoryId in
// categories and delete them and also delete any TemplateWorkItemData that reference
// those workItems
export function useCleanOrphanedWorkItemsCallback() {
  const store = useStore(useStoreId());
  return useCallback((): void => {
    if (!store) return;

    const categoriesTable = store.getTable('categories') || {};
    const validCategoryIds = new Set(Object.keys(categoriesTable));

    const workItemsTable = store.getTable('workItems') || {};
    const orphanedWorkItemIds: string[] = [];

    // Identify orphaned work items
    for (const [workItemId, workItem] of Object.entries(workItemsTable)) {
      if (!validCategoryIds.has(workItem.categoryId ?? '')) {
        orphanedWorkItemIds.push(workItemId);
      }
    }

    // Delete orphaned work items
    for (const workItemId of orphanedWorkItemIds) {
      store.delRow('workItems', workItemId);
    }

    // Clean up TemplateWorkItemData references
    const templateWorkItemsTable = store.getTable('templateWorkItems') || {};
    for (const [templateId, templateWorkItem] of Object.entries(templateWorkItemsTable)) {
      const workItemIds = templateWorkItem.workItemIds
        ? templateWorkItem.workItemIds.split(',').filter((id) => !orphanedWorkItemIds.includes(id))
        : [];
      store.setRow('templateWorkItems', templateId, {
        ...templateWorkItem,
        workItemIds: workItemIds.join(','),
      });
    }
  }, [store]);
}

// create a hook to create a new template with all work item passing
// in only the name and description for the template
export function useCreateTemplateWithAllWorkItemsCallback() {
  const store = useStore(useStoreId());
  const addRow = useAddRowCallback('templates');
  return useCallback(
    (name = 'All Cost Items', description = 'This template includes all cost items'): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      // Create the new template
      const templateResult = addRow({
        name,
        description,
      } as ProjectTemplateData);

      if (templateResult.status !== 'Success') {
        return { status: 'Error', id: '0', msg: 'Failed to create template' };
      }

      const newTemplateId = templateResult.id;

      // Get all work items
      const workItemsTable = store.getTable('workItems') || {};
      const allWorkItemIds = Object.keys(workItemsTable);

      // Create the TemplateWorkItemData entry
      store.setRow('templateWorkItems', newTemplateId, {
        id: newTemplateId,
        templateId: newTemplateId,
        workItemIds: allWorkItemIds.join(','),
      } as TemplateWorkItemData);

      return { status: 'Success', id: newTemplateId, msg: '' };
    },
    [store, addRow],
  );
}
