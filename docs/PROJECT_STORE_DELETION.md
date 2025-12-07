# Project Store Deletion Implementation

This document describes the implementation for properly deleting project stores, including both client-side and server-side cleanup.

## Overview

When a project is deleted from the application, we need to clean up:
1. **Client-side**: Delete the local SQLite database and request server-side deletion
2. **Server-side**: Delete the stored data from the Cloudflare Durable Object
3. **Component lifecycle**: Properly handle unmount cleanup without deleting persisted data

## Key Design Principle

**Critical distinction**: Component unmounting ≠ Project deletion

- `ProjectDetailsStore` components unmount for various reasons:
  - Navigation away from a project view
  - Memory management (removing inactive projects from `activeProjectIds`)
  - App backgrounding or closing
  - **AND** project deletion

- Database and server data should **ONLY** be deleted when the user explicitly deletes a project
- Database should **persist** across unmounts so data is available when the user returns

## Client-Side Implementation

### Component Unmount Cleanup (Automatic)

When `ProjectDetailsStore` unmounts for ANY reason, we clean up resources but preserve data:

#### Persister Cleanup (`useCreateClientPersisterAndStart.ts`)
- Stops auto-save to prevent writes during destruction
- Destroys the persister to release resources
- **Does NOT delete the SQLite database** (data persists)

#### Synchronizer Cleanup (`useCreateServerSynchronizerAndStart.ts`)
- Stops synchronization to prevent network activity
- Closes the WebSocket connection
- Destroys the synchronizer
- **Does NOT request server deletion** (data persists on server)

### Explicit Project Deletion

When the user explicitly deletes a project, `deleteProjectDetailsStore()` is called:

#### Database Deletion (`ProjectDetailsStoreHooks.tsx`)
- Deletes the SQLite database file using `deleteDatabaseSync()`
- Requests server-side deletion via `deleteServerStore()`
- This happens **in addition to** the automatic unmount cleanup

### Deletion Flow

1. User deletes a project from the project list
2. `processDeleteProject(projectId)` - removes from project list store
3. `removeActiveProjectId(projectId)` - triggers component unmount
   - Unmount cleanup: stops sync/persist, closes connections, destroys resources
   - **Database and server data remain intact**
4. `deleteProjectDetailsStore(projectId)` - **explicitly called** to delete data
   - Deletes SQLite database file
   - Sends DELETE request to server

### Key Files Modified

- `/src/tbStores/persistence/useCreateClientPersisterAndStart.ts` - Added destroy callback for persister cleanup (no DB deletion)
- `/src/tbStores/synchronization/useCreateServerSynchronizerAndStart.ts` - Added destroy callback for synchronizer cleanup (no server deletion)
- `/src/tbStores/synchronization/deleteServerStore.ts` - Utility for server deletion request
- `/src/tbStores/synchronization/syncConfig.ts` - Shared server URL config
- `/src/tbStores/projectDetails/ProjectDetailsStoreHooks.tsx` - Implemented `deleteProjectDetailsStore()` with DB and server deletion

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

1. **Test Normal Navigation (Data Persists)**
   - Create a test project with some data
   - Navigate away from the project
   - Check console: should see "Cleaning up synchronizer/persister" messages
   - Navigate back to the project
   - Verify: Data is still there (loaded from local DB)

2. **Test Project Deletion (Data Removed)**
   - Create a test project with some data
   - Delete the project from the project list
   - Check console logs for:
     - "Cleaning up synchronizer for storeId: ..." (from unmount)
     - "Cleaning up persister for storeId: ..." (from unmount)
     - "Deleting ProjectDetailsStore database: ..." (from explicit delete)
     - "Successfully deleted database: ..."
     - "Sending deletion request to server for storeId: ..."
   - Verify: SQLite database file is removed
   - Verify: DELETE request sent to server (check network tab or server logs)

3. **Test Offline Deletion**
   - Disconnect from network
   - Delete a project
   - Verify: Local database is still deleted
   - Verify: Server deletion request fails gracefully (logged, doesn't crash)

## Error Handling

Both client-side cleanup functions use try-catch blocks to ensure:
- Errors don't prevent the deletion flow from completing
- Errors are logged for debugging
- Local cleanup succeeds even if server deletion fails
- The user experience is not disrupted by cleanup failures

## Notes

- The client-side implementation correctly separates unmount cleanup from deletion
- Database files persist between navigation/unmounts for offline access
- Server-side DELETE handler requires implementation in the Cloudflare Worker
- Server-side cleanup is optional but recommended for complete data removal
- If the server doesn't implement DELETE handling, data may persist in Durable Objects

## Related Files

- Client persistence: `/src/tbStores/persistence/`
- Server synchronization: `/src/tbStores/synchronization/`
- Project details store: `/src/tbStores/projectDetails/`
- Active projects context: `/src/context/ActiveProjectIdsContext.tsx`
- Store provider: `/src/components/ActiveProjectDetailsStoreProvider.tsx`
