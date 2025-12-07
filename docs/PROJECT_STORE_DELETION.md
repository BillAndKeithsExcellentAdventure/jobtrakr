# Project Store Deletion Implementation

This document describes the implementation for properly deleting project stores, including both client-side and server-side cleanup.

## Overview

When a project is deleted from the application, we need to clean up:
1. **Client-side**: Stop synchronization, destroy the persister, and delete the local SQLite database
2. **Server-side**: Delete the stored data from the Cloudflare Durable Object

## Client-Side Implementation

### Automatic Cleanup on Component Unmount

The cleanup is implemented using TinyBase's destroy callbacks in the persister and synchronizer hooks:

#### Persister Cleanup (`useCreateClientPersisterAndStart.ts`)
- Stops auto-save
- Destroys the persister
- Deletes the SQLite database file using `deleteDatabaseSync()`

#### Synchronizer Cleanup (`useCreateServerSynchronizerAndStart.ts`)
- Stops synchronization
- Closes the WebSocket connection
- Sends a DELETE request to the server
- Destroys the synchronizer

### Deletion Flow

1. User deletes a project from the project list
2. Project is removed from `activeProjectIds` in `ActiveProjectIdsContext`
3. `ProjectDetailsStore` component unmounts for that project
4. Unmount triggers the destroy callbacks in both hooks
5. Cleanup happens automatically:
   - Synchronizer: stops sync, closes WS, notifies server, destroys
   - Persister: stops auto-save, destroys, deletes DB file

### Key Files Modified

- `/src/tbStores/persistence/useCreateClientPersisterAndStart.ts` - Added destroy callback for persister cleanup
- `/src/tbStores/synchronization/useCreateServerSynchronizerAndStart.ts` - Added destroy callback for synchronizer cleanup
- `/src/tbStores/synchronization/deleteServerStore.ts` - New utility for server deletion request
- `/src/tbStores/projectDetails/ProjectDetailsStoreHooks.tsx` - Updated `deleteProjectDetailsStore` documentation

## Server-Side Implementation

### Required Server Changes

The Cloudflare Durable Object server needs to handle DELETE requests to remove stored data.

#### Implementation in Durable Object

Add a DELETE handler to the `WsServerDurableObject` fetch method:

```typescript
import { WsServerDurableObject } from 'tinybase/synchronizers/synchronizer-ws-server-durable-object';
import { createDurableObjectStoragePersister } from 'tinybase/persisters/persister-durable-object-storage';
import { createMergeableStore } from 'tinybase';

export class MyDurableObject extends WsServerDurableObject {
  createPersister() {
    const store = createMergeableStore();
    const persister = createDurableObjectStoragePersister(
      store,
      this.ctx.storage,
    );
    return persister;
  }

  async fetch(request: Request): Promise<Response> {
    // Handle DELETE requests for store cleanup
    if (request.method === 'DELETE') {
      try {
        // Get the path/storeId from the URL
        const url = new URL(request.url);
        const storeId = url.pathname.substring(1); // Remove leading '/'
        
        console.log(`Received DELETE request for storeId: ${storeId}`);
        
        // Clear all data from the Durable Object storage
        await this.ctx.storage.deleteAll();
        
        return new Response(
          JSON.stringify({ success: true, message: 'Store data deleted' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error deleting store data:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete store data' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Delegate WebSocket and other requests to the parent class
    return super.fetch(request);
  }
}
```

### Alternative: Automatic Cleanup

Alternatively, the server can implement automatic cleanup based on inactivity:

```typescript
export class MyDurableObject extends WsServerDurableObject {
  onPathId(pathId: string, addedOrRemoved: number) {
    if (addedOrRemoved === -1) {
      // Last client disconnected
      console.log(`Last client disconnected from path: ${pathId}`);
      
      // Optionally set a timer to delete data after some period of inactivity
      setTimeout(async () => {
        const clientIds = this.getClientIds();
        if (clientIds.length === 0) {
          console.log(`No clients connected, cleaning up data for path: ${pathId}`);
          await this.ctx.storage.deleteAll();
        }
      }, 60000); // Wait 1 minute before cleanup
    }
  }
}
```

## Testing

To verify the implementation works correctly:

1. **Create a test project** with some data
2. **Delete the project** from the project list
3. **Check the console logs** for cleanup messages:
   - "Cleaning up synchronizer for storeId: ..."
   - "Cleaning up persister for storeId: ..."
   - "Successfully deleted database: ..."
4. **Verify the SQLite database file is removed** from the device
5. **Check server logs** to confirm DELETE request was received (if server-side is implemented)

## Error Handling

Both client-side cleanup functions use try-catch blocks to ensure:
- Errors don't prevent the deletion flow from completing
- Errors are logged for debugging
- Local cleanup succeeds even if server deletion fails
- The user experience is not disrupted by cleanup failures

## Notes

- The client-side implementation is complete and functional
- The server-side DELETE handler requires implementation in the Cloudflare Worker
- Server-side cleanup is optional but recommended for complete data removal
- If the server doesn't implement DELETE handling, data may persist in Durable Objects but will eventually be cleaned up by Cloudflare's automatic garbage collection when the object is inactive

## Related Files

- Client persistence: `/src/tbStores/persistence/`
- Server synchronization: `/src/tbStores/synchronization/`
- Project details store: `/src/tbStores/projectDetails/`
- Active projects context: `/src/context/ActiveProjectIdsContext.tsx`
- Store provider: `/src/components/ActiveProjectDetailsStoreProvider.tsx`
