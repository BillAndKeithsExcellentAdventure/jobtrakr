import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useWorkItemSpentSummary } from '@/src/context/WorkItemSpentSummaryContext';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { getStoreId, TABLES_SCHEMA } from './ProjectDetailsStore';
import { CrudResult } from '@/src/models/types';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { useProjectValue } from '../listOfProjects/ListOfProjectsStore';

const { useCell, useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export interface ProjectCounters {
  id: string;
  nextReceiptNumber: number;
  nextInvoiceNumber: number;
}

export interface WorkItemSummaryData {
  id: string;
  workItemId: string;
  bidAmount: number;
  complete: boolean; // true if all cost items are accounted for
  bidNote?: string;
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
  accountingId: string;
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
  accountingId: string;
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
  isPublic: boolean;
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
export type ProjectCountersSchema = typeof TABLES_SCHEMA.projectCounters;
export type ReceiptsSchema = typeof TABLES_SCHEMA.receipts;
export type InvoicesSchema = typeof TABLES_SCHEMA.invoices;
export type WorkItemCostEntriesSchema = typeof TABLES_SCHEMA.workItemCostEntries;
export type MediaEntriesSchema = typeof TABLES_SCHEMA.mediaEntries;
export type NotesSchema = typeof TABLES_SCHEMA.notes;
export type ChangeOrderSchema = typeof TABLES_SCHEMA.notes;
export type ChangeOrderItemSchema = typeof TABLES_SCHEMA.notes;

export type SchemaMap = {
  projectCounters: ProjectCountersSchema;
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
  projectCounters: ProjectCounters;
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

/**
 * Generates an accounting ID in the format "prefix-abbreviation-count"
 * @param prefix - "receipt" or "invoice"
 * @param abbreviation - Project abbreviation
 * @param count - Counter value
 * @returns Formatted accounting ID
 */
export function generateAccountingId(
  prefix: 'receipt' | 'invoice',
  abbreviation: string,
  count: number,
): string {
  return `${prefix}-${abbreviation}-${count}`;
}

/**
 * Hook to get or initialize the project counters
 */
export const useProjectCounters = (projectId: string): ProjectCounters | undefined => {
  const store = useStore(getStoreId(projectId));
  const [counters, setCounters] = useState<ProjectCounters | undefined>(undefined);
  
  const fetchCounters = useCallback(() => {
    if (!store) return undefined;
    
    const counterRow = store.getRow('projectCounters', 'counters');
    if (counterRow) {
      return { id: 'counters', ...counterRow } as ProjectCounters;
    }
    
    // Initialize counters if they don't exist
    const initialCounters: ProjectCounters = {
      id: 'counters',
      nextReceiptNumber: 1,
      nextInvoiceNumber: 1,
    };
    store.setRow('projectCounters', 'counters', initialCounters);
    return initialCounters;
  }, [store]);

  useEffect(() => {
    setCounters(fetchCounters());
  }, [fetchCounters]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener('projectCounters', () => setCounters(fetchCounters()));
    return () => {
      store.delListener(listenerId);
    };
  }, [store, fetchCounters]);

  return counters;
};

/**
 * Hook to increment and get the next receipt or invoice number
 */
export const useIncrementCounter = (projectId: string) => {
  const store = useStore(getStoreId(projectId));
  
  return useCallback(
    (type: 'receipt' | 'invoice'): number => {
      if (!store) return 1;
      
      const counterRow = store.getRow('projectCounters', 'counters');
      let nextNumber = 1;
      
      if (counterRow) {
        if (type === 'receipt') {
          nextNumber = (counterRow.nextReceiptNumber as number) || 1;
          store.setCell('projectCounters', 'counters', 'nextReceiptNumber', nextNumber + 1);
        } else {
          nextNumber = (counterRow.nextInvoiceNumber as number) || 1;
          store.setCell('projectCounters', 'counters', 'nextInvoiceNumber', nextNumber + 1);
        }
      } else {
        // Initialize counters if they don't exist
        const initialCounters: ProjectCounters = {
          id: 'counters',
          nextReceiptNumber: type === 'receipt' ? 2 : 1,
          nextInvoiceNumber: type === 'invoice' ? 2 : 1,
        };
        store.setRow('projectCounters', 'counters', initialCounters);
      }
      
      return nextNumber;
    },
    [store],
  );
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
 * Hook that returns a callback to clear all tables in the ProjectDetailsStore.
 * This is used during project deletion to sync the empty state across all devices.
 *
 * By clearing all tables instead of deleting the local database or server data,
 * the empty state will be synchronized across all connected devices via TinyBase's
 * sync mechanism. This approach:
 * - Preserves the local database structure for reuse
 * - Syncs the deletion across all devices
 * - Allows TinyBase to manage cleanup naturally
 *
 * @param projectId - The ID of the project
 * @returns A callback that clears all tables in the store
 */
export const useClearProjectDetailsStoreCallback = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(async (): Promise<boolean> => {
    if (!store) {
      console.error('Store not found for project:', projectId);
      return false;
    }

    try {
      console.log(`Clearing all tables in ProjectDetailsStore for project: ${projectId}`);
      store.delTables();
      console.log(`Successfully cleared all tables for project: ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Error clearing tables for project ${projectId}:`, error);
      return false;
    }
  }, [store, projectId]);
};
