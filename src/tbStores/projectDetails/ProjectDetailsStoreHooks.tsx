import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useWorkItemSpentSummary } from '@/src/context/WorkItemSpentSummaryContext';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { getStoreId, TABLES_SCHEMA } from './ProjectDetailsStore';
import { CrudResult } from '@/src/models/types';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { useProjectValue } from '../listOfProjects/ListOfProjectsStore';
import { deleteDatabaseSync } from 'expo-sqlite';
import { deleteServerStore } from '../synchronization/deleteServerStore';

const { useCell, useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export interface WorkItemSummaryData {
  id: string;
  workItemId: string;
  bidAmount: number;
  complete: boolean; // true if all cost items are accounted for
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
  supplier: string;
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

export type ClassifiedInvoiceData = InvoiceData & { fullyClassified: boolean };

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
  return [...rows].sort(compareFn);
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

// function to get workitems for a given project that has no costs associated with it and no bid amount
export const useWorkItemsWithoutCosts = (projectId: string): WorkItemSummaryData[] => {
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItemCostEntries = useAllRows(projectId, 'workItemCostEntries');

  return allWorkItemSummaries.filter(
    (wis) =>
      wis.bidAmount === 0 && !allWorkItemCostEntries.some((wice) => wice.workItemId === wis.workItemId),
  );
};

/**
 * Hook to get the spent amount for a specific work item
 * This replaces the old useWorkItemSpentValue hook that read from the store
 */
export const useWorkItemSpentValue = (projectId: string, workItemId: string): number => {
  const { getWorkItemSpentAmount } = useWorkItemSpentSummary();
  return getWorkItemSpentAmount(projectId, workItemId);
};

/**
 * Hook that watches workItemCostEntries and updates the WorkItemSpentSummary context
 * This replaces the old useSetWorkItemSpentSummaryCallback hook
 *
 * Note:
 * - The context's setWorkItemSpentAmount method checks if values have changed
 *   before updating state, preventing unnecessary re-renders.
 * - Work items with no cost entries will not be in the map, and will return 0
 *   from getWorkItemSpentAmount (handled by the context getter).
 */
export const useWorkItemSpentUpdater = (projectId: string): void => {
  const allWorkItemCostEntries = useAllRows(projectId, 'workItemCostEntries');
  const { setWorkItemSpentAmount } = useWorkItemSpentSummary();

  useEffect(() => {
    // Group cost entries by workItemId and calculate total spent per work item
    const spentByWorkItem = new Map<string, number>();

    for (const costEntry of allWorkItemCostEntries) {
      spentByWorkItem.set(
        costEntry.workItemId,
        (spentByWorkItem.get(costEntry.workItemId) ?? 0) + costEntry.amount,
      );
    }

    // Update the context with all spent amounts
    // The setWorkItemSpentAmount method will skip updates if the value hasn't changed
    for (const [workItemId, spentAmount] of spentByWorkItem) {
      setWorkItemSpentAmount(projectId, workItemId, spentAmount);
    }
  }, [allWorkItemCostEntries, projectId, setWorkItemSpentAmount]);
};

/**
 * Deletes the ProjectDetailsStore database and server data for a given project.
 * This function should be called after a project is deleted from the project list.
 * 
 * This performs the actual database file deletion and server-side cleanup that should
 * only happen when the user explicitly deletes a project, not when the ProjectDetailsStore
 * component unmounts for other reasons (e.g., navigation, memory management).
 * 
 * Note: The persister and synchronizer cleanup (stopAutoSave, stopSync, destroy)
 * happens automatically when the ProjectDetailsStore component unmounts via the
 * destroy callbacks in the hooks.
 *
 * @param projectId - The ID of the project whose store should be deleted
 */
export const deleteProjectDetailsStore = (projectId: string): void => {
  const storeId = getStoreId(projectId);
  const databaseName = `${storeId}.db`;

  try {
    console.log(`Deleting ProjectDetailsStore database: ${databaseName}`);
    deleteDatabaseSync(databaseName);
    console.log(`Successfully deleted ProjectDetailsStore database: ${databaseName}`);
  } catch (error) {
    console.error(`Error deleting ProjectDetailsStore database ${databaseName}:`, error);
    // Don't throw - we want deletion to continue even if database cleanup fails
  }

  // Request server-side deletion of the store data
  // This is async but we don't await it - deletion should continue even if server request fails
  deleteServerStore(storeId).catch((error) => {
    console.error(`Failed to request server deletion for ${storeId}:`, error);
  });
};
