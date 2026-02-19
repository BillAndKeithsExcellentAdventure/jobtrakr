import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './ReceiptQueueStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useState } from 'react';
import { CrudResult } from '@/src/models/types';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export interface ReceiptLineItem {
  itemDescription: string;
  amount: number;
  projectId: string;
}

export interface ReceiptQueueEntry {
  id: string; // purchaseId_toProjectId
  purchaseId: string;
  fromProjectId: string;
  vendorRef: string;
  imageId?: string;
  lineItems: ReceiptLineItem[];
  createdAt: number;
}

export interface ReceiptQueueEntryInput {
  purchaseId: string;
  fromProjectId: string;
  vendorRef: string;
  imageId?: string;
  lineItems: ReceiptLineItem[];
}

export type RECEIPT_QUEUE_TABLES = keyof typeof TABLES_SCHEMA;

// --- Helper function to serialize line items ---
export const serializeReceiptLineItems = (lineItems: ReceiptLineItem[]): string => {
  return JSON.stringify(lineItems);
};

// --- Helper function to deserialize line items ---
export const deserializeReceiptLineItems = (serialized: string): ReceiptLineItem[] => {
  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};

// --- Convert raw store row to ReceiptQueueEntry ---
const rowToReceiptQueueEntry = (row: any): ReceiptQueueEntry => {
  return {
    id: row.id,
    purchaseId: row.purchaseId,
    fromProjectId: row.fromProjectId,
    vendorRef: row.vendorRef,
    imageId: row.imageId,
    lineItems: deserializeReceiptLineItems(row.lineItems || '[]'),
    createdAt: row.createdAt,
  };
};

// --- Retrieve all queued receipt entries ---
export const useAllReceiptQueueEntries = (): ReceiptQueueEntry[] => {
  const store = useStore(useStoreId());
  const [entries, setEntries] = useState<ReceiptQueueEntry[]>([]);

  const fetchEntries = useCallback(() => {
    if (!store) return [];
    const table = store.getTable('receiptQueueEntries');
    if (!table) return [];

    return Object.entries(table)
      .map(([, row]) => rowToReceiptQueueEntry(row as any))
      .sort((a, b) => a.createdAt - b.createdAt); // Sort by creation time, oldest first
  }, [store]);

  useEffect(() => {
    setEntries(fetchEntries());
  }, [fetchEntries]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener('receiptQueueEntries', () => {
      setEntries(fetchEntries());
    });
    return () => {
      store.delListener(listenerId);
    };
  }, [store, fetchEntries]);

  return entries;
};

// --- Retrieve a specific queued entry ---
export const useReceiptQueueEntry = (purchaseId: string): ReceiptQueueEntry | null => {
  const store = useStore(useStoreId());
  const entryId = purchaseId;
  const [entry, setEntry] = useState<ReceiptQueueEntry | null>(null);

  useEffect(() => {
    if (!store) return;
    const row = store.getRow('receiptQueueEntries', entryId);
    setEntry(row ? rowToReceiptQueueEntry(row as any) : null);
  }, [store, entryId]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addRowListener('receiptQueueEntries', entryId, () => {
      const row = store.getRow('receiptQueueEntries', entryId);
      setEntry(row ? rowToReceiptQueueEntry(row as any) : null);
    });
    return () => {
      store.delListener(listenerId);
    };
  }, [store, entryId]);

  return entry;
};

// --- ADD a new queued receipt entry ---
export function useAddReceiptQueueEntryCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (data: ReceiptQueueEntryInput): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const id = data.purchaseId;
      const now = Date.now();

      const success = store.setRow('receiptQueueEntries', id, {
        id,
        purchaseId: data.purchaseId,
        fromProjectId: data.fromProjectId,
        vendorRef: data.vendorRef,
        imageId: data.imageId || '',
        lineItems: serializeReceiptLineItems(data.lineItems),
        createdAt: now,
      });

      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to write receipt queue entry' };
    },
    [store],
  );
}

// --- UPDATE a queued receipt entry ---
export function useUpdateReceiptQueueEntryCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (purchaseId: string, updates: Partial<ReceiptQueueEntryInput>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const id = purchaseId;
      const existing = store.getRow('receiptQueueEntries', id);
      if (!existing) return { status: 'Error', id: '0', msg: 'Queue entry not found' };

      const updatedRow = {
        ...existing,
        ...(updates.vendorRef && { vendorRef: updates.vendorRef }),
        ...(updates.imageId !== undefined && { imageId: updates.imageId || '' }),
        ...(updates.lineItems && { lineItems: serializeReceiptLineItems(updates.lineItems) }),
      };

      const success = store.setRow('receiptQueueEntries', id, updatedRow);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to update receipt queue entry' };
    },
    [store],
  );
}

// --- DELETE a queued receipt entry ---
export function useDeleteReceiptQueueEntryCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (purchaseId: string, toProjectId: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const id = purchaseId;
      const existing = store.getRow('receiptQueueEntries', id);
      if (!existing) return { status: 'Error', id: '0', msg: 'Queue entry not found' };

      store.delRow('receiptQueueEntries', id);
      return { status: 'Success', id, msg: '' };
    },
    [store],
  );
}

// --- DELETE all queued entries for a specific project ---
export function useDeleteAllReceiptQueueEntriesForProjectCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (toProjectId: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

      const table = store.getTable('receiptQueueEntries');
      if (!table) return { status: 'Success', id: '', msg: 'No entries to delete' };

      let deletedCount = 0;
      for (const [entryId, row] of Object.entries(table)) {
        if ((row as any).toProjectId === toProjectId) {
          store.delRow('receiptQueueEntries', entryId);
          deletedCount++;
        }
      }

      return {
        status: 'Success',
        id: '',
        msg: `Deleted ${deletedCount} queue entries for project ${toProjectId}`,
      };
    },
    [store],
  );
}

// --- CLEAR all queued receipt entries ---
export function useClearAllReceiptQueueEntriesCallback() {
  const store = useStore(useStoreId());
  return useCallback((): CrudResult => {
    if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };

    const table = store.getTable('receiptQueueEntries');
    if (!table) return { status: 'Success', id: '', msg: 'Queue already empty' };

    const entryIds = Object.keys(table);
    entryIds.forEach((id) => store.delRow('receiptQueueEntries', id));

    return { status: 'Success', id: '', msg: `Cleared ${entryIds.length} queue entries` };
  }, [store]);
}
