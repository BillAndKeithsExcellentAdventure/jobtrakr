import React, { useCallback } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';

const STORE_ID_PREFIX = 'projectDetailsStore-';

export const TABLES_SCHEMA = {
  workItemSummary: {
    id: { type: 'string' },
    workItemId: { type: 'string' },
    bidAmount: { type: 'number' },
    spentAmount: { type: 'number' },
  },

  workItemCostEntries: {
    id: { type: 'string' },
    workItemId: { type: 'string' },
    vendor: { type: 'string' },
    itemDescription: { type: 'string' },
    amount: { type: 'number' },
    documentationType: { type: 'string' }, // 'receipt' or 'invoice'
    documentationUri: { type: 'string' }, // URI to the receipt or invoice photo
  },

  receiptEntries: {
    id: { type: 'string' },
    vendor: { type: 'string' },
    description: { type: 'string' },
    amount: { type: 'number' },
    receiptDate: { type: 'number' },
    thumbnail: { type: 'string' },
    pictureDate: { type: 'number' },
    pictureUri: { type: 'string' },
    notes: { type: 'string' },
  },

  receiptItemEntries: {
    id: { type: 'string' },
    label: { type: 'string' },
    amount: { type: 'number' },
    receiptId: { type: 'string' },
    category: { type: 'string' },
    workItem: { type: 'string' },
  },

  mediaEntries: {
    id: { type: 'string' },
    assetId: { type: 'string' }, // only used when media is on local device
    deviceName: { type: 'string' }, // only used when media is on local device
    mediaType: { type: 'string' }, // 'video' or 'photo'
    mediaUri: { type: 'string' }, // URI to the video or photo
  },

  notes: {
    id: { type: 'string' },
    task: { type: 'string' },
    completed: { type: 'boolean' },
  },
} as const;

type WorkItemSummarySchema = typeof TABLES_SCHEMA.workItemSummary;
type WorkItemCostEntriesSchema = typeof TABLES_SCHEMA.workItemCostEntries;
type NotesSchema = typeof TABLES_SCHEMA.notes;

const { useCreateMergeableStore, useProvideStore } = UiReact as UiReact.WithSchemas<
  [typeof TABLES_SCHEMA, NoValuesSchema]
>;

export const getStoreId = (projId: string) => STORE_ID_PREFIX + projId;

// Create, persist, and sync a store containing the project and its categories.
export default function ProjectDetailsStore({ projectId }: { projectId: string }) {
  const storeId = getStoreId(projectId);
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));

  useCreateClientPersisterAndStart(storeId, store);
  //useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
