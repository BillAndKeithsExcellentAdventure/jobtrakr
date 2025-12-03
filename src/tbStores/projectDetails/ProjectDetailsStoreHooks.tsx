import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { NoValuesSchema } from 'tinybase/with-schemas';
import { getStoreId, TABLES_SCHEMA } from './ProjectDetailsStore';
import { CrudResult } from '@/src/models/types';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { useProjectValue } from '../listOfProjects/ListOfProjectsStore';

const { useCell, useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export interface WorkItemSummaryData {
  id: string;
  workItemId: string;
  bidAmount: number;
  complete: boolean; // true if all cost items are accounted for
}

export interface WorkItemSpentSummary {
  workItemId: string; // IMPORTANT - this is the workItemId NOT the id of the WorkItemSummaryData.
  spentAmount: number; //     This is because the receipts are linked to the workItem and category.
}

// show the most recent date first
export function RecentReceiptDateCompare(a: ReceiptData, b: ReceiptData) {
  const aValue = Number(a.receiptDate);
  const bValue = Number(b.receiptDate);
  return bValue - aValue;
}

// show the most recent date first
export function RecentInvoiceDateCompare(a: InvoiceData, b: InvoiceData) {
  const aValue = Number(a.invoiceDate);
  const bValue = Number(b.invoiceDate);
  return bValue - aValue;
}

// show the most recent date first
export function RecentMediaEntryDateCompare(a: MediaEntryData, b: MediaEntryData) {
  const aValue = Number(a.creationDate);
  const bValue = Number(b.creationDate);
  return bValue - aValue;
}

// show the note that are not completed first
export function NoteCompletedCompare(a: NoteData, b: NoteData) {
  if (a.completed === b.completed) return 0;
  return a.completed ? 1 : -1; // completed notes go to the end
  // uncompleted notes go to the front
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

export type ClassifiedReceiptData = ReceiptData & { fullyClassified: boolean };

export type InvoiceData = {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  numLineItems: number;
  invoiceDate: number;
  invoiceNumber: string;
  thumbnail: string;
  pictureDate: number;
  imageId: string;
  notes: string;
  markedComplete: boolean;
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

export interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  bidAmount: number;
  status: 'draft' | 'approval-pending' | 'approved' | 'cancelled';
  dateCreated: number; // Date the change order was created.
}

export interface ChangeOrderItem {
  id: string;
  changeOrderId: string;
  label: string;
  amount: number;
  workItemId: string;
}

export type WorkItemSummarySchema = typeof TABLES_SCHEMA.workItemSummaries;
export type WorkItemSpentSummarySchema = typeof TABLES_SCHEMA.workItemSpentSummaries;
export type ReceiptsSchema = typeof TABLES_SCHEMA.receipts;
export type InvoicesSchema = typeof TABLES_SCHEMA.invoices;
export type WorkItemCostEntriesSchema = typeof TABLES_SCHEMA.workItemCostEntries;
export type MediaEntriesSchema = typeof TABLES_SCHEMA.mediaEntries;
export type NotesSchema = typeof TABLES_SCHEMA.notes;
export type ChangeOrderSchema = typeof TABLES_SCHEMA.notes;
export type ChangeOrderItemSchema = typeof TABLES_SCHEMA.notes;

export type SchemaMap = {
  workItemSummaries: WorkItemSummarySchema;
  workItemCostEntries: WorkItemCostEntriesSchema;
  receipts: ReceiptsSchema;
  invoices: InvoicesSchema;
  mediaEntries: MediaEntriesSchema;
  notes: NotesSchema;
  changeOrders: ChangeOrderSchema;
  changeOrderItems: ChangeOrderItemSchema;
};

// Type mapping between table names and data types
export type TableDataMap = {
  workItemSummaries: WorkItemSummaryData;
  workItemCostEntries: WorkItemCostEntry;
  receipts: ReceiptData;
  invoices: InvoiceData;
  mediaEntries: MediaEntryData;
  notes: NoteData;
  changeOrders: ChangeOrder;
  changeOrderItems: ChangeOrderItem;
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
  compareFn?: (a: TableDataMap[K], b: TableDataMap[K]) => number,
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
  }, [store, tableName, fetchRows]);

  if (!compareFn) return rows;
  return rows.sort(compareFn);
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
    [store, tableId],
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
): Value<SchemaMap[T], C> =>
  useCell(tableId, rowId, cellId as any, getStoreId(projectId)) as Value<SchemaMap[T], C>;

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
  }, [allCostRows, setAmountSpent]);
};

/* Watch for changes to table workItemSummaries and recalculate the total amount bid 
   and then update the project summary information */
export const useBidAmountUpdater = (projectId: string): void => {
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const [, setBidAmount] = useProjectValue(projectId, 'bidPrice');

  useEffect(() => {
    const bidEstimate = allWorkItemSummaries.reduce((sum, item) => sum + item.bidAmount, 0);
    setBidAmount(bidEstimate);
  }, [allWorkItemSummaries, setBidAmount]);
};

/* Watch for changes to table workItemSummaries and recalculate the total amount bid 
   and then update the project summary information */
export const useSeedWorkItemsIfNecessary = (projectId: string): void => {
  const [seedWorkItems, setSeedWorkItems] = useProjectValue(projectId, 'seedWorkItems');
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const addWorkItemSummary = useAddRowCallback(projectId, 'workItemSummaries');
  const { activeProjectIds } = useActiveProjectIds();

  const seedInitialData = useCallback((): void => {
    if (allWorkItemSummaries.length > 0 || !seedWorkItems) return;

    const workItemIds = seedWorkItems.split(',');
    setSeedWorkItems(''); // Clear the seedWorkItems after seeding
    for (const workItemId of workItemIds) {
      if (!workItemId) continue;
      addWorkItemSummary({
        id: '',
        workItemId,
        bidAmount: 0,
        complete: false,
      });
    }
  }, [seedWorkItems, allWorkItemSummaries, addWorkItemSummary, setSeedWorkItems]);

  useEffect(() => {
    if (activeProjectIds.includes(projectId)) {
      if (projectId && seedWorkItems && allWorkItemSummaries.length === 0) {
        console.log('Seeding initial data for project', projectId);
        seedInitialData();
      }
    }
  }, [projectId, seedWorkItems, allWorkItemSummaries, activeProjectIds, seedInitialData]);
};

export function useSetWorkItemSpentSummaryCallback(projectId: string) {
  const store = useStore(getStoreId(projectId));
  return useCallback(
    (workItemId: string, updates: Partial<WorkItemSpentSummary>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const existing = store.getRow('workItemSpentSummaries', workItemId);
      if (!existing) {
        const insertSuccess = store.setRow('workItemSpentSummaries', workItemId, { workItemId, ...updates });
        return insertSuccess
          ? { status: 'Success', id: workItemId, msg: '' }
          : { status: 'Error', id: '0', msg: 'Failed to insert work item spent summary' };
      }

      const success = store.setRow('workItemSpentSummaries', workItemId, { ...existing, ...updates });
      return success
        ? { status: 'Success', id: workItemId, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to update' };
    },
    [store],
  );
}

export const useWorkItemSpentValue = (projectId: string, workItemId: string): number =>
  useCell('workItemSpentSummaries', workItemId, 'spentAmount', getStoreId(projectId)) as number;

// function to get workitems for a given project that has no costs associated with it and no bid amount
export const useWorkItemsWithoutCosts = (projectId: string): WorkItemSummaryData[] => {
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItemCostEntries = useAllRows(projectId, 'workItemCostEntries');

  return allWorkItemSummaries.filter(
    (wis) =>
      wis.bidAmount === 0 && !allWorkItemCostEntries.some((wice) => wice.workItemId === wis.workItemId),
  );
};
