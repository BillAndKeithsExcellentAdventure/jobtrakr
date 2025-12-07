import * as UiReact from 'tinybase/ui-react/with-schemas';
import { Content, MergeableStore, OptionalSchemas } from 'tinybase/with-schemas';
import { createClientPersister } from './createClientPersister';
import { deleteDatabaseSync } from 'expo-sqlite';

export const useCreateClientPersisterAndStart = <Schemas extends OptionalSchemas>(
  storeId: string,
  store: MergeableStore<Schemas>,
  initialValues?: string,
  then?: () => void,
) =>
  (UiReact as UiReact.WithSchemas<Schemas>).useCreatePersister(
    store,
    // Create the persister.
    (store: MergeableStore<Schemas>) => createClientPersister(storeId, store),
    [storeId],
    async (persister) => {
      // Determine if there is initial content for a newly-created store.
      let initialContent: Content<Schemas> | undefined = undefined;
      try {
        if (initialValues) initialContent = [{}, JSON.parse(initialValues)];
      } catch {}

      // Start the persistence.
      await persister.load(initialContent);
      await persister.startAutoSave();
      then?.();
    },
    [storeId, initialValues],
    async (persister) => {
      // Cleanup: stop auto-save, destroy persister, and delete the database
      console.log(`Cleaning up persister for storeId: ${storeId}`);
      try {
        await persister.stopAutoSave();
        await persister.destroy();
        
        // Delete the SQLite database file
        const databaseName = `${storeId}.db`;
        deleteDatabaseSync(databaseName);
        console.log(`Successfully deleted database: ${databaseName}`);
      } catch (error) {
        console.error(`Error cleaning up persister for ${storeId}:`, error);
      }
    },
    [storeId],
  );
