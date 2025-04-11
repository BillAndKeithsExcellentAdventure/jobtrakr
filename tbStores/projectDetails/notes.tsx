import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { TABLES_SCHEMA, getStoreId } from './ProjectDetailsStore';
import { NoValuesSchema } from 'tinybase/with-schemas';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;
const NOTES_TABLE = 'notes';

export interface NoteData {
  id: string;
  task: string;
  completed: boolean;
}

/**
 * Hook to return all notes for a project.
 */
export const useAllNotes = (projectId: string): NoteData[] => {
  const storeId = getStoreId(projectId);
  const store = useStore(storeId);
  const [notes, setNotes] = useState<NoteData[]>([]);

  useEffect(() => {
    if (!store) return;

    const getNotesFromTable = () => {
      const table = store.getTable(NOTES_TABLE);
      return table
        ? Object.entries(table).map(([id, row]) => ({
            id,
            task: row.task ?? '',
            completed: !!row.completed,
          }))
        : [];
    };

    setNotes(getNotesFromTable());

    const listenerId = store.addTableListener(NOTES_TABLE, () => {
      setNotes(getNotesFromTable());
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return notes;
};

/**
 * Hook to add a note.
 */
export const useAddNote = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (noteData: Omit<NoteData, 'id'>) => {
      if (!store) return { status: 'Error', msg: 'Store not available', id: '' };

      const id = randomUUID();
      const noteWithId: NoteData = { ...noteData, id };

      const result = store.setRow(NOTES_TABLE, id, noteWithId);
      return result
        ? { status: 'Success', msg: '', id }
        : { status: 'Error', msg: 'Failed to add note', id: '' };
    },
    [store],
  );
};

/**
 * Hook to update a note.
 */
export const useUpdateNote = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (note: NoteData) => {
      if (!store) return { status: 'Error', msg: 'Store not available' };
      const result = store.setRow(NOTES_TABLE, note.id!, note);
      return result ? { status: 'Success', msg: '' } : { status: 'Error', msg: 'Failed to update note' };
    },
    [store],
  );
};

/**
 * Hook to delete a note.
 */
export const useDeleteNote = (projectId: string) => {
  const store = useStore(getStoreId(projectId));

  return useCallback(
    (id: string) => {
      if (!store) return { status: 'Error', msg: 'Store not available' };
      const result = store.delRow(NOTES_TABLE, id);
      return result
        ? { status: 'Success', msg: '' }
        : { status: 'Error', msg: `Failed to delete note with id: ${id}` };
    },
    [store],
  );
};
