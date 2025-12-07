import * as UiReact from 'tinybase/ui-react/with-schemas';
import { Content, MergeableStore, OptionalSchemas } from 'tinybase/with-schemas';
import { createClientPersister } from './createClientPersister';

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
      // Cleanup on unmount: stop auto-save and destroy persister
      // Note: We do NOT delete the database here because the component may unmount
      // for reasons other than project deletion (e.g., navigation, memory management).
      // Database deletion only happens in deleteProjectDetailsStore() when the project
      // is explicitly deleted by the user.
      console.log(`Cleaning up persister for storeId: ${storeId}`);
      try {
        await persister.stopAutoSave();
        await persister.destroy();
        console.log(`Successfully cleaned up persister for: ${storeId}`);
      } catch (error) {
        console.error(`Error cleaning up persister for ${storeId}:`, error);
      }
    },
    [storeId],
  );
