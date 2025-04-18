import React, { useCallback } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';
import { randomUUID } from 'expo-crypto';
import { getProjectValue } from '../ListOfProjectsStore';

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

  mediaEntries: {
    id: { type: 'string' },
    assetId: { type: 'string' }, // only used when media is on local device
    deviceName: { type: 'string' }, // only used when media is on local device
    mediaType: { type: 'string' }, // 'video' or 'photo'
    mediaUri: { type: 'string' }, // URI to the receipt or invoice photo
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

  const seedWorkItems = getProjectValue(projectId, 'seedJobWorkItems');
  console.log(`Value of seedJobWorkItems =  ${seedWorkItems}`);

  const seedInitialData = useCallback((): void => {
    if (!seedWorkItems) return;

    const table = store.getTable('workItemSummary');
    // If the table already has rows, do not seed it again.
    if (table && Object.keys(table).length > 0) {
      console.log('Table already has rows, not seeding again.');
      return;
    }
    const workItemIds = seedWorkItems.split(',');
    console.log('Initializing project with the following workitems.', workItemIds);

    for (const workItemId of workItemIds) {
      if (!workItemId) continue;
      const id = randomUUID();
      store.setRow('workItemSummary', id, {
        id,
        workItemId,
        bidAmount: 0,
        spentAmount: 0,
      });
    }
  }, [seedWorkItems, storeId, store]);

  useCreateClientPersisterAndStart(storeId, store, undefined, seedInitialData);
  //useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
