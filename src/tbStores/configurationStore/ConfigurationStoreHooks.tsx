import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './ConfigurationStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  accountingId?: string; // QuickBooks Account Id used for expense sync override
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
  email?: string;
  mobilePhone?: string;
  businessPhone?: string;
  notes?: string;
  inactive?: boolean;
  matchCompareString?: string; // string used when processing receipt/invoice photo to determine if the vendor returned from processing is this vendor.
  // e.g. home*depot could be used to match 'Home.Depot' or 'Home...Depot', while 'home?depot' would match 'Home Depot' or 'Home.Depot'
}

export interface CustomerData {
  id: string;
  accountingId: string; // QuickBooks Customer Id
  name: string;
  contactName: string; // Contact name for the customer, not provided by QuickBooks but can be filled in by the user
  email: string;
  phone: string;
  inactive?: boolean;
}

export interface AccountData {
  id: string;
  accountingId: string; // QuickBooks Account Id
  name: string;
  accountType: string; // e.g., 'Expense', 'Bank', 'Credit Card', 'Other Current Asset'
  accountSubType: string; // e.g., 'Checking', 'CreditCard',
}

export function VendorDataCompareName(a: VendorData, b: VendorData) {
  const aValue = a.name.toLowerCase();
  const bValue = b.name.toLowerCase();
  if (aValue < bValue) return -1;
  if (aValue > bValue) return 1;
  return 0;
}

export function CustomerDataCompareName(a: CustomerData, b: CustomerData) {
  const aValue = a.name.toLowerCase();
  const bValue = b.name.toLowerCase();
  if (aValue < bValue) return -1;
  if (aValue > bValue) return 1;
  return 0;
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
export type CustomersSchema = typeof TABLES_SCHEMA.customers;

export type SchemaMap = {
  templates: TemplateSchema;
  categories: CategorySchema;
  workItems: WorkItemsSchema;
  vendors: VendorsSchema;
  accounts: AccountsSchema;
  customers: CustomersSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  vendors: VendorData;
  templates: ProjectTemplateData;
  templateWorkItems: TemplateWorkItemData;
  categories: WorkCategoryData;
  workItems: WorkItemData;
  accounts: AccountData;
  customers: CustomerData;
};

export type CONFIGURATION_TABLES = keyof TableDataMap;

//  Extract table names and cell ID types
export type TableName = keyof typeof TABLES_SCHEMA;
export type CellIdMap = {
  [K in TableName]: keyof (typeof TABLES_SCHEMA)[K];
};

// --- Raw store access (e.g. for wrapping bulk mutations in a transaction) ---
export const useConfigurationStore = () => useStore(useStoreId());

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

export function useSetWorkItemAccountingIdsCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (workItemIds: string[], accountingId?: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      if (workItemIds.length === 0) return { status: 'Error', id: '0', msg: 'No work items selected' };

      for (const workItemId of workItemIds) {
        const existing = store.getRow('workItems', workItemId);
        if (!existing) {
          return { status: 'Error', id: workItemId, msg: 'Row not found' };
        }

        if (accountingId && accountingId.length > 0) {
          store.setRow('workItems', workItemId, { ...existing, accountingId });
          continue;
        }

        const { accountingId: _removed, ...rowWithoutAccountingId } = existing;
        store.setRow('workItems', workItemId, rowWithoutAccountingId);
      }

      return { status: 'Success', id: workItemIds[0], msg: '' };
    },
    [store],
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

const parseDelimitedIds = (value?: string): string[] =>
  value
    ? value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

// --- HOOKS TO SET WORKITEMIDS FOR A TEMPLATE ---
export const useTemplateWorkItemData = (templateId: string) => {
  const store = useStore(useStoreId());
  const allTemplateWorkItems = useAllRows('templateWorkItems');
  const allWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);

  const templateWorkItemData = useMemo(
    () => allTemplateWorkItems.find((row) => row.templateId === templateId || row.id === templateId) ?? null,
    [allTemplateWorkItems, templateId],
  );

  const templateWorkItemIds = useMemo(
    () => parseDelimitedIds(templateWorkItemData?.workItemIds),
    [templateWorkItemData?.workItemIds],
  );

  const templateWorkCategoryIds = useMemo(() => {
    if (templateWorkItemIds.length === 0) {
      return [];
    }

    const categoryIds = new Set<string>();
    for (const workItemId of templateWorkItemIds) {
      const workItem = allWorkItems.find((item) => item.id === workItemId);
      if (workItem) {
        categoryIds.add(workItem.categoryId);
      }
    }

    return Array.from(categoryIds);
  }, [templateWorkItemIds, allWorkItems]);

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
        const targetRowId = templateWorkItemData?.id || templateId;

        store.setRow('templateWorkItems', targetRowId, {
          id: targetRowId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [templateWorkItemData?.id, templateWorkItemIds, store, templateId],
  );

  const setActiveWorkItemIds = useCallback(
    (workItemIds: string[]) => {
      const workItemIdsString = workItemIds.join(',');

      if (store) {
        const targetRowId = templateWorkItemData?.id || templateId;

        store.setRow('templateWorkItems', targetRowId, {
          id: targetRowId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [templateWorkItemData?.id, store, templateId],
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

/**
 * Converts a matchCompareString pattern into a RegExp.
 * '*' matches any number of characters.
 * The pattern is searched for anywhere within the target string (not anchored).
 */
function matchPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[-\\^$+.()|[\]{}?]/g, '\\$&');
  const withWildcards = escaped.replace(/\*/g, '.*');
  return new RegExp(withWildcards, 'i');
}

/**
 * Hook that provides a callback to find the first vendor
 * whose matchCompareString pattern matches the given vendor name.
 */
export function useVendorMatch(vendors: VendorData[]) {
  const vendorPatternsWithMatch = useMemo(
    () =>
      vendors
        .filter((v) => !!v.matchCompareString)
        .map((v) => ({ vendor: v, regex: matchPatternToRegExp(v.matchCompareString!) })),
    [vendors],
  );

  const vendorsWithoutMatch = useMemo(() => vendors.filter((v) => !v.matchCompareString), [vendors]);

  const findFirstVendorMatch = useCallback(
    (vendorName: string): VendorData | undefined => {
      if (!vendorName) return undefined;
      // Pass 1: check vendors with an explicit matchCompareString pattern
      const patternMatch = vendorPatternsWithMatch.find(({ regex }) => regex.test(vendorName))?.vendor;
      if (patternMatch) return patternMatch;
      // Pass 2: case-insensitive substring search against vendor.name
      const lowerName = vendorName.toLowerCase();
      return vendorsWithoutMatch.find((v) => lowerName.includes(v.name.toLowerCase()));
    },
    [vendorPatternsWithMatch, vendorsWithoutMatch],
  );

  return { findFirstVendorMatch };
}
