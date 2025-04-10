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

const useStoreId = (projId: string) => STORE_ID_PREFIX + projId;

const useUserId = () => '8888-KMB'; // Replace with a userId

// Create, persist, and sync a store containing the project and its categories.
function ProjectDetailsStore({ activeProjectId }: { activeProjectId: string }) {
  const storeId = useStoreId(activeProjectId);
  console.log('ProjectDetailsStore - storeId:', storeId);

  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log('ProjectDetailsStore - store:', store.getJson());
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  return null;
}

export default function ProjectDetailsStoreProvider() {
  const { activeProjectId } = useActiveProjectId(); // get activeProjectId from context

  return <ProjectDetailsStore key={activeProjectId} activeProjectId={activeProjectId} />;
}

///////////////////////////////////////////////////////////////////////////////
// Custom hooks for notes
///////////////////////////////////////////////////////////////////////////////
/* Hook to return an array of all notes for a specific project. */
export const useAllNotes = (activeProjectId: string) => {
  const storeId = useStoreId(activeProjectId);
  const [allNotes, setAllNotes] = useState<NoteData[]>([]);

  console.log('useAllNotes - storeId:', storeId);
  let store = useStore(storeId);

  const fetchAllNotes = useCallback((): NoteData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('notes');
    if (table) {
      const notes: NoteData[] = Object.entries(table).map(([id, row]) => ({
        id: id,
        task: row.task ?? '',
        completed: !!row.completed,
      }));

      return notes;
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllNotes(fetchAllNotes());
  }, [fetchAllNotes]);

  useEffect(() => {
    if (!store) return;

    const handleTableChange = () => {
      setAllNotes(fetchAllNotes());
    };

    const listenerId = store.addTableListener('notes', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      console.log('useAllNotes - removing listenerId:', listenerId);
      store.delListener(listenerId);
    };
  }, [store, fetchAllNotes]);

  return allNotes;
};

// Returns a callback that adds a new note to the store.
export const useAddNoteCallback = (activeProjectId: string) => {
  const storeId = useStoreId(activeProjectId);
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
  const storeId = useStoreId(activeProjectId);
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
  const storeId = useStoreId(activeProjectId);
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
