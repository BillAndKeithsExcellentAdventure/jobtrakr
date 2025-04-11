import { useActiveProjectId } from '@/context/ActiveProjectIdContext';
import React from 'react';
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

  notes: {
    id: { type: 'string' },
    task: { type: 'string' },
    completed: { type: 'boolean' },
  },
} as const;

type WorkItemSummarySchema = typeof TABLES_SCHEMA.workItemSummary;
type WorkItemCostEntriesSchema = typeof TABLES_SCHEMA.workItemCostEntries;
type NotesSchema = typeof TABLES_SCHEMA.notes;

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideRelationships,
  useProvideStore,
  useRowCount,
  useSetCellCallback,
  useSetValueCallback,
  useSortedRowIds,
  useStore,
  useCreateRelationships,
  useTable,
  useValue,
  useValuesListener,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export const getStoreId = (projId: string) => STORE_ID_PREFIX + projId;

// Create, persist, and sync a store containing the project and its categories.
function ProjectDetailsStore({ activeProjectId }: { activeProjectId: string }) {
  const storeId = getStoreId(activeProjectId);
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}

export default function ProjectDetailsStoreProvider() {
  const { activeProjectId } = useActiveProjectId(); // get activeProjectId from context
  if (!activeProjectId) return null; // Don't render if no active project ID
  return <ProjectDetailsStore key={activeProjectId} activeProjectId={activeProjectId} />;
}
