import React, { useCallback, useEffect } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';

const STORE_ID_PREFIX = 'projectDetailsStore-';

export const TABLES_SCHEMA = {
  workItemSummaries: {
    id: { type: 'string' },
    workItemId: { type: 'string' },
    bidAmount: { type: 'number' },
    complete: { type: 'boolean' },
  },

  workItemSpentSummaries: {
    workItemId: { type: 'string' },
    spentAmount: { type: 'number' },
  },

  receipts: {
    id: { type: 'string' },
    vendor: { type: 'string' },
    description: { type: 'string' },
    amount: { type: 'number' }, // Total Amount
    numLineItems: { type: 'number' }, // Number of line items in the receipt
    receiptDate: { type: 'number' }, // Date on the receipt.
    thumbnail: { type: 'string' },
    pictureDate: { type: 'number' }, // Date the picture was taken.
    imageId: { type: 'string' },
    notes: { type: 'string' }, // not currently in ui
    markedComplete: { type: 'boolean' },
  },

  invoices: {
    id: { type: 'string' },
    vendor: { type: 'string' },
    description: { type: 'string' },
    amount: { type: 'number' }, // Total Amount
    numLineItems: { type: 'number' }, // Number of line items in the invoice
    invoiceDate: { type: 'number' }, // Date on the invoice.
    invoiceNumber: { type: 'string' }, // Vendor's invoice number
    thumbnail: { type: 'string' },
    pictureDate: { type: 'number' }, // Date the picture was taken.
    imageId: { type: 'string' },
    notes: { type: 'string' }, // not currently in ui
    markedComplete: { type: 'boolean' },
  },

  workItemCostEntries: {
    id: { type: 'string' },
    label: { type: 'string' },
    amount: { type: 'number' },
    workItemId: { type: 'string' },
    parentId: { type: 'string' }, // ReceiptId or InvoiceId
    documentationType: { type: 'string' }, // 'receipt' or 'invoice'
  },

  mediaEntries: {
    id: { type: 'string' },
    assetId: { type: 'string' }, // only used when media is on local device
    deviceName: { type: 'string' }, // only used when media is on local device
    imageId: { type: 'string' }, // the id of the image as stored in the uri.
    mediaType: { type: 'string' }, // 'video' or 'photo'
    thumbnail: { type: 'string' }, // thumbnail image.
    creationDate: { type: 'number' }, // Date the picture was taken.
  },

  notes: {
    id: { type: 'string' },
    task: { type: 'string' },
    completed: { type: 'boolean' },
  },

  changeOrders: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    bidAmount: { type: 'number' },
    status: { type: 'string' }, // 'draft' | 'approval-pending' | 'approved' | 'cancelled';
    dateCreated: { type: 'number' }, // Date the change order was created.
  },

  changeOrderItems: {
    id: { type: 'string' },
    changeOrderId: { type: 'string' },
    label: { type: 'string' },
    amount: { type: 'number' },
    workItemId: { type: 'string' },
  },
} as const;

const { useCreateMergeableStore, useProvideStore } = UiReact as UiReact.WithSchemas<
  [typeof TABLES_SCHEMA, NoValuesSchema]
>;

export const getStoreId = (projId: string) => STORE_ID_PREFIX + projId;

// Create, persist, and sync a store containing the project and its categories.
export default function ProjectDetailsStore({ projectId }: { projectId: string }) {
  useEffect(() => console.log('Mounting ProjectDetailsStore for projectId:', projectId), [projectId]);
  const storeId = getStoreId(projectId);
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));

  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
