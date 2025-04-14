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
import {
  JobTemplateData,
  JobTemplateWorkItemData,
  VendorData,
  WorkCategoryData,
  WorkItemData,
} from '@/models/types';

type CrudResult = { status: 'Success' | 'Error'; id: string; msg: string };

export type CategorySchema = typeof TABLES_SCHEMA.categories;
export type WorkItemsSchema = typeof TABLES_SCHEMA.workItems;
export type TemplateSchema = typeof TABLES_SCHEMA.templates;
export type VendorsSchema = typeof TABLES_SCHEMA.vendors;

export type CategoriesCellId = keyof (typeof TABLES_SCHEMA)['categories'];
export type WorkItemsCellId = keyof (typeof TABLES_SCHEMA)['workItems'];
export type TemplatesCellId = keyof (typeof TABLES_SCHEMA)['templates'];
export type VendorsCellId = keyof (typeof TABLES_SCHEMA)['vendors'];

export type SchemaMap = {
  templates: TemplateSchema;
  categories: CategorySchema;
  workItems: WorkItemsSchema;
  vendors: VendorsSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  vendors: VendorData;
  templates: JobTemplateData;
  templateWorkItems: JobTemplateWorkItemData;
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
): (TableDataMap[K] & { _id: string })[] => {
  const store = useStore(useStoreId());
  const [rows, setRows] = useState<(TableDataMap[K] & { _id: string })[]>([]);

  const fetchRows = useCallback(() => {
    if (!store) return [];
    const table = store.getTable(tableName);
    return table
      ? (Object.entries(table).map(([id, row]) => ({
          _id: id,
          ...row,
        })) as (TableDataMap[K] & { _id: string })[])
      : [];
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
  const store = useStore();
  return useCallback(
    (id: string, data: TableDataMap[K]): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const success = store.setRow(tableId, id, { ...data } as any);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to write' };
    },
    [store, tableId],
  );
}

// --- UPDATE ROW ---
export function useUpdateRowCallback<K extends CONFIGURATION_TABLES>(tableId: K) {
  const store = useStore();
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
  const store = useStore();
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
): (TableDataMap[K] & { _id?: string }) | undefined {
  return useRow(tableId, id) as TableDataMap[K] | undefined;
}

// --- VALUE HOOKS ---

export const useVendorValue = <ValueId extends VendorsCellId>(
  vendorId: string,
  valueId: ValueId,
): Value<VendorsSchema, ValueId> =>
  (useCell('vendors', vendorId, valueId, useStoreId()) as Value<VendorsSchema, ValueId>) ??
  ('' as Value<VendorsSchema, ValueId>);

export const useCategoryValue = <ValueId extends CategoriesCellId>(
  categoryId: string,
  valueId: ValueId,
): Value<CategorySchema, ValueId> =>
  (useCell('categories', categoryId, valueId, useStoreId()) as Value<CategorySchema, ValueId>) ??
  ('' as Value<CategorySchema, ValueId>);

export const useTemplateValue = <ValueId extends TemplatesCellId>(
  templateId: string,
  valueId: ValueId,
): Value<TemplateSchema, ValueId> =>
  (useCell('templates', templateId, valueId, useStoreId()) as Value<TemplateSchema, ValueId>) ??
  ('' as Value<TemplateSchema, ValueId>);

export const useWorkItemValue = <ValueId extends WorkItemsCellId>(
  workItemId: string,
  valueId: ValueId,
): Value<WorkItemsSchema, ValueId> =>
  (useCell('workItems', workItemId, valueId, useStoreId()) as Value<WorkItemsSchema, ValueId>) ??
  ('' as Value<WorkItemsSchema, ValueId>);
