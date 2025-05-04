import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { getStoreId, TABLES_SCHEMA } from './ProjectDetailsStore';
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
import { CrudResult } from '@/models/types';
import { useProjectValue } from '../listOfProjects/ListOfProjectsStore';

export interface WorkItemSummaryData {
  id: string;
  workItemId: string;
  bidAmount: number;
  spentAmount: number;
}

export type ReceiptData = {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  numLineItems: number;
  receiptDate: number;
  thumbnail: string;
  pictureDate: number;
  imageId: string;
  notes: string;
  markedComplete: boolean;
};

export type InvoiceData = {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  invoiceDate: number;
  invoiceNumber: string;
  thumbnail: string;
  pictureDate: number;
  imageId: string;
  notes: string;
};

export type WorkItemCostEntry = {
  id: string;
  label: string;
  amount: number;
  workItemId: string;
  parentId: string; // the receiptId or invoiceId
  documentationType: 'receipt' | 'invoice';
};

export interface MediaEntryData {
  id: string;
  assetId: string;
  deviceName: string;
  imageId: string; // id of the image as stored in the uri and the thus the C2 datastore.
  mediaType: 'video' | 'photo';
  thumbnail: string;
  creationDate: number;
}

export interface NoteData {
  id: string;
  task: string;
  completed: boolean;
}

export type WorkItemSummarySchema = typeof TABLES_SCHEMA.workItemSummaries;
export type ReceiptsSchema = typeof TABLES_SCHEMA.receipts;
export type InvoicesSchema = typeof TABLES_SCHEMA.invoices;
export type WorkItemCostEntriesSchema = typeof TABLES_SCHEMA.workItemCostEntries;
export type MediaEntriesSchema = typeof TABLES_SCHEMA.mediaEntries;
export type NotesSchema = typeof TABLES_SCHEMA.notes;

export type SchemaMap = {
  workItemSummaries: WorkItemSummarySchema;
  workItemCostEntries: WorkItemCostEntriesSchema;
  receipts: ReceiptsSchema;
  invoices: InvoicesSchema;
  mediaEntries: MediaEntriesSchema;
  notes: NotesSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  workItemSummaries: WorkItemSummaryData;
  workItemCostEntries: WorkItemCostEntry;
  receipts: ReceiptData;
  invoices: InvoiceData;
  mediaEntries: MediaEntryData;
  notes: NoteData;
};

export type PROJECTDETAILS_TABLES = keyof TableDataMap;

//  Extract table names and cell ID types
export type TableName = keyof typeof TABLES_SCHEMA;
export type CellIdMap = {
  [K in TableName]: keyof (typeof TABLES_SCHEMA)[K];
};

// --- Retrieve all rows of a table ---
export const useAllRows = <K extends keyof TableDataMap>(
  projectId: string,
  tableName: K,
): TableDataMap[K][] => {
  const store = useStore(getStoreId(projectId));
  const [rows, setRows] = useState<TableDataMap[K][]>([]);

  const fetchRows = useCallback(() => {
    if (!store) return [];
    const table = store.getTable(tableName);
    return table
      ? (Object.entries(table).map(([id, row]) => ({
          ...row,
          id: id,
        })) as TableDataMap[K][])
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
export function useAddRowCallback<K extends PROJECTDETAILS_TABLES>(projectId: string, tableId: K) {
  const store = useStore(getStoreId(projectId));
  return useCallback(
    (data: TableDataMap[K]): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const id = randomUUID();
      const success = store.setRow(tableId, id, { ...data, id } as any);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to write' };
    },
    [store, projectId, tableId],
  );
}

// --- UPDATE ROW ---
export function useUpdateRowCallback<K extends PROJECTDETAILS_TABLES>(projectId: string, tableId: K) {
  const store = useStore(getStoreId(projectId));
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
export function useDeleteRowCallback<K extends PROJECTDETAILS_TABLES>(projectId: string, tableId: K) {
  const store = useStore(getStoreId(projectId));
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
export function useTypedRow<K extends PROJECTDETAILS_TABLES>(
  projectId: string,
  tableId: K,
  id: string,
): (TableDataMap[K] & { id: string }) | undefined {
  const store = useStore(getStoreId(projectId));
  if (!store) return undefined;
  const row = store.getRow(tableId, id);
  if (!row) return undefined;
  return { id, ...row } as TableDataMap[K];
}

// --- VALUE HOOK ---
export const useTableValue = <T extends keyof SchemaMap, C extends Extract<keyof SchemaMap[T], string>>(
  projectId: string,
  tableId: T,
  rowId: string,
  cellId: C,
): Value<SchemaMap[T], C> => useCell(tableId, rowId, cellId, getStoreId(projectId)) as Value<SchemaMap[T], C>;

export function useIsStoreAvailableCallback(projectId: string) {
  const store = useStore(getStoreId(projectId));
  return useCallback((): boolean => {
    if (!store) return false;
    return true;
  }, [store]);
}

/* Watch for changes to table workItemCostEntries and recalculate the total amount spent 
   and then update the project summary information */
export const useCostUpdater = (projectId: string): void => {
  const allCostRows = useAllRows(projectId, 'workItemCostEntries');
  const [, setAmountSpent] = useProjectValue(projectId, 'amountSpent');

  useEffect(() => {
    const spentAmount = allCostRows.reduce((sum, item) => sum + item.amount, 0);
    setAmountSpent(spentAmount);
  }, [allCostRows]);
};

/* Watch for changes to table workItemSummaries and recalculate the total amount bid 
   and then update the project summary information */
export const useBidAmountUpdater = (projectId: string): void => {
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const [, setBidAmount] = useProjectValue(projectId, 'bidPrice');

  useEffect(() => {
    const bidEstimate = allWorkItemSummaries.reduce((sum, item) => sum + item.bidAmount, 0);
    setBidAmount(bidEstimate);
  }, [allWorkItemSummaries]);
};
