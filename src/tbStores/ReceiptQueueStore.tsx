import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

const STORE_ID_PREFIX = 'PHV1_ReceiptQueueStore';
export const TABLES_SCHEMA = {
  receiptQueueEntries: {
    id: { type: 'string' }, // purchaseId_toProjectId (unique key for queued receipt)
    purchaseId: { type: 'string' }, // Original purchase/receipt ID
    toProjectId: { type: 'string' }, // Project ID where this receipt needs to be added
    fromProjectId: { type: 'string' }, // Project ID where this receipt was originally created
    vendorRef: { type: 'string' }, // Vendor reference/ID
    imageId: { type: 'string' }, // Optional image ID associated with receipt
    lineItems: { type: 'string' }, // JSON stringified array of ReceiptLineItem objects
    createdAt: { type: 'number' }, // Timestamp when entry was queued
  },
} as const;

const {
  useCreateMergeableStore,
  useProvideStore,
  useStore: useStoreInternal,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export const useStoreId = () => {
  const { orgId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${orgId}`, [orgId]);
  return storeId;
};

export const useReceiptQueueStoreId = useStoreId;
export const useReceiptQueueStore = () => useStoreInternal(useStoreId());

// Create, persist, and sync a store containing receipt queue entries awaiting processing
export default function ReceiptQueueStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
