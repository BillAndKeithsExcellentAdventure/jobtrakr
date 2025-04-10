import { useActiveProjectId } from '@/context/ActiveProjectIdContext';
import { NoteData, TBStatus } from '@/models/types';
import { randomUUID } from 'expo-crypto';
import React, { useCallback, useEffect, useState } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';

const STORE_ID_PREFIX = 'projectDetailsStore-';

const TABLES_SCHEMA = {
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

const getStoreId = (projId: string) => STORE_ID_PREFIX + projId;
const getUserId = () => '8888-KMB'; // Replace with a userId

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

///////////////////////////////////////////////////////////////////////////////
// Custom hooks for notes
///////////////////////////////////////////////////////////////////////////////
/* Hook to return an array of all notes for a specific project. */
export const useAllNotes = (activeProjectId: string) => {
  const storeId = getStoreId(activeProjectId);
  const [allNotes, setAllNotes] = useState<NoteData[]>([]);
  const store = useStore(storeId);

  useEffect(() => {
    if (!store) return;
    const table = store.getTable('notes');
    const notes = table
      ? Object.entries(table).map(([id, row]) => ({
          id,
          task: row.task ?? '',
          completed: !!row.completed,
        }))
      : [];

    setAllNotes(notes);

    const listenerId = store.addTableListener('notes', () => {
      const updatedTable = store.getTable('notes');
      const updatedNotes = updatedTable
        ? Object.entries(updatedTable).map(([id, row]) => ({
            id,
            task: row.task ?? '',
            completed: !!row.completed,
          }))
        : [];
      setAllNotes(updatedNotes);
    });

    return () => {
      console.log('useAllNotes - removing listenerId:', listenerId);
      store.delListener(listenerId);
    };
  }, [store]);

  return allNotes;
};

// Returns a callback that adds a new note to the store.
export const useAddNoteCallback = (activeProjectId: string) => {
  const storeId = getStoreId(activeProjectId);
  let store = useStore(storeId);

  return useCallback(
    (noteData: NoteData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      noteData.id = id;

      console.log(`Adding a new note with ID: ${id}, note: ${noteData.task}`);
      if (store) {
        const storeCheck = store.setRow('notes', id, noteData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that updates an existing note in the store.
export const useUpdateNoteCallback = (activeProjectId: string) => {
  const storeId = getStoreId(activeProjectId);
  let store = useStore(storeId);

  return useCallback(
    (noteData: NoteData): { status: TBStatus; msg: string } => {
      if (store && noteData.id) {
        const storeCheck = store.setRow('notes', noteData.id, noteData);
        if (storeCheck) {
          return { status: 'Success', msg: '' };
        } else {
          return { status: 'Error', msg: 'Unable to setRow' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found' };
      }
    },
    [store],
  );
};

// Returns a callback that deletes a note from the store.
export const useDeleteNoteCallback = (activeProjectId: string) => {
  const storeId = getStoreId(activeProjectId);
  let store = useStore(storeId);

  return useCallback(
    (id: string): { status: TBStatus; msg: string } => {
      if (store) {
        const storeCheck = store.delRow('notes', id);
        if (storeCheck) {
          return { status: 'Success', msg: '' };
        } else {
          return { status: 'Error', msg: `useDeleteNoteCallback - Unable to delete Row with id = ${id}` };
        }
      } else {
        return { status: 'Error', msg: 'useDeleteNoteCallback - Store not found' };
      }
    },
    [store],
  );
};
