import ReconnectingWebSocket from 'reconnecting-websocket';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client/with-schemas';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { MergeableStore, OptionalSchemas } from 'tinybase/with-schemas';
import { deleteServerStore } from './deleteServerStore';
import { SYNC_SERVER_URL } from './syncConfig';

export const useCreateServerSynchronizerAndStart = <Schemas extends OptionalSchemas>(
  storeId: string,
  store: MergeableStore<Schemas>,
) =>
  (UiReact as UiReact.WithSchemas<Schemas>).useCreateSynchronizer(
    store,
    async (store: MergeableStore<Schemas>) => {
      // Create the synchronizer.
      const synchronizer = await createWsSynchronizer(
        store,
        new ReconnectingWebSocket(SYNC_SERVER_URL + storeId, [], {
          maxReconnectionDelay: 1000,
          connectionTimeout: 1000,
        }),
      );

      // Start the synchronizer.
      await synchronizer.startSync();

      // If the websocket reconnects in the future, do another explicit sync.
      synchronizer.getWebSocket().addEventListener('open', () => {
        synchronizer.load().then(() => synchronizer.save());
      });

      return synchronizer;
    },
    [storeId],
    async (synchronizer) => {
      // Cleanup: stop sync, close websocket, request server deletion, and destroy synchronizer
      console.log(`Cleaning up synchronizer for storeId: ${storeId}`);
      try {
        await synchronizer.stopSync();
        
        // Close the WebSocket connection if it exists (WsSynchronizer specific)
        // Use type-safe check for the getWebSocket method
        if ('getWebSocket' in synchronizer && typeof synchronizer.getWebSocket === 'function') {
          const ws = synchronizer.getWebSocket();
          if (ws && ws.readyState !== WebSocket.CLOSED) {
            ws.close();
          }
        }
        
        // Request server-side deletion of the store data
        await deleteServerStore(storeId);
        
        await synchronizer.destroy();
        console.log(`Successfully cleaned up synchronizer for: ${storeId}`);
      } catch (error) {
        console.error(`Error cleaning up synchronizer for ${storeId}:`, error);
      }
    },
    [storeId],
  );
