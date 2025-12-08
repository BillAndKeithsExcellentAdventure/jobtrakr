# Project Store Deletion Implementation

This document describes the simplified implementation for properly deleting project stores using TinyBase's synchronization mechanism.

## Overview

When a project is deleted from the application, we use a simplified approach:
1. **Clear all tables in the store** - Using `store.delTables()` to remove all data
2. **Sync empty state** - The empty state syncs across all devices via TinyBase
3. **Component lifecycle** - Properly handle unmount cleanup without deleting persisted data

## Key Design Principles

### Critical Distinction: Component Unmounting ≠ Project Deletion

`ProjectDetailsStore` components unmount for various reasons:
- Navigation away from a project view
- Memory management (removing inactive projects from `activeProjectIds`)
- App backgrounding or closing
- **AND** project deletion

**Important**: The local SQLite database and server data should **persist** across unmounts. We only clear the data (not delete the database) when the user explicitly deletes a project.

### Why `store.delTables()` Instead of Deleting Database/Server Data

**Previous approaches had issues:**
- Deleting local database only → Other devices don't know about deletion, project reappears
- Deleting server data → Complex, requires server-side implementation
- Deleting on every unmount → Data loss on navigation

**Current approach benefits:**
- ✅ `store.delTables()` clears all data from all tables
- ✅ Empty state syncs to all connected devices via TinyBase
- ✅ Simple, no server-side code changes needed
- ✅ Local database structure preserved for reuse
- ✅ Works offline - empty state syncs when reconnected
- ✅ No data resurrection from other devices

## Client-Side Implementation

### Component Unmount Cleanup (Automatic)

When `ProjectDetailsStore` unmounts for ANY reason, we clean up resources but preserve data:

#### Persister Cleanup (`useCreateClientPersisterAndStart.ts`)
- Stops auto-save to prevent writes during destruction
- Destroys the persister to release resources
- **Does NOT delete the SQLite database** (database structure persists)

#### Synchronizer Cleanup (`useCreateServerSynchronizerAndStart.ts`)
- Stops synchronization to prevent network activity
- Closes the WebSocket connection
- Destroys the synchronizer
- **Does NOT request server deletion** (data management handled by TinyBase)

### Explicit Project Deletion

When the user explicitly deletes a project:

#### Clear All Tables (`useClearProjectDetailsStoreCallback`)
- Calls `store.delTables()` to remove all data from all tables
- This empty state is synchronized to all connected devices
- Ensures other devices see the project as empty
- The local database file remains but is empty

### Deletion Flow

1. User confirms project deletion
2. **`clearProjectDetailsStore()`** - clears all tables in the store
   - `store.delTables()` removes all data
   - Empty state syncs to all connected devices
   - Prevents project from reappearing on other devices
3. Small delay (500ms) to allow sync propagation
4. Navigate back to project list
5. `processDeleteProject(projectId)` - removes from project list store
6. `removeActiveProjectId(projectId)` - triggers component unmount
   - Unmount cleanup: stops sync/persist, closes connections, destroys resources
   - Database file persists but is empty
   - No additional cleanup needed

### Key Files Modified

- `/src/tbStores/persistence/useCreateClientPersisterAndStart.ts` - Destroy callback for persister cleanup (no DB deletion)
- `/src/tbStores/synchronization/useCreateServerSynchronizerAndStart.ts` - Destroy callback for synchronizer cleanup (no server deletion)
- `/src/tbStores/projectDetails/ProjectDetailsStoreHooks.tsx` - `useClearProjectDetailsStoreCallback()` hook to clear all tables
- `/src/app/(protected)/(home)/[projectId]/index.tsx` - Updated deletion handler to only clear tables

## Testing

To verify the implementation works correctly:

### 1. Test Normal Navigation (Data Persists)
- Create a test project with some data
- Navigate away from the project
- Check console: should see "Cleaning up synchronizer/persister" messages
- Navigate back to the project
- **Verify**: Data is still there (loaded from local DB)

### 2. Test Project Deletion (Data Cleared and Synced)
- Create a test project with some data on Device A
- Ensure Device B is also synced with this project
- Delete the project from Device A
- Check console logs on Device A:
  - "Clearing all tables in ProjectDetailsStore for project: ..."
  - "Successfully cleared all tables for project: ..."
  - "Cleaning up synchronizer for storeId: ..." (from unmount)
  - "Cleaning up persister for storeId: ..." (from unmount)
- **Verify on Device A**: Project data is empty (but database file exists)
- **Verify on Device B**: Project data is cleared (all tables empty via sync)
- **Verify**: No additional server requests needed

### 3. Test Multi-Device Synchronization
- Create a project on Device A with data
- Sync to Device B (should see the project with data)
- Delete the project on Device A (clears all tables)
- Wait for sync on Device B
- **Verify on Device B**: Project shows as empty (tables cleared via sync)
- This confirms the empty state synced correctly

### 4. Test Offline Deletion
- Disconnect from network
- Delete a project
- **Verify**: Tables are cleared locally
- Reconnect to network
- **Verify**: Empty state syncs to other devices when reconnected

## Error Handling

The cleanup functions use try-catch blocks to ensure:
- Errors don't prevent the deletion flow from completing
- Errors are logged for debugging
- The user experience is not disrupted by cleanup failures

## Implementation Notes

- **Simple and effective**: No server-side code changes needed
- **Multi-device safe**: Empty state syncs naturally via TinyBase
- **Database preserved**: SQLite database structure reused, reducing overhead
- **Offline compatible**: Works offline, syncs when reconnected
- **No data resurrection**: Deleted projects stay deleted across all devices

## Related Files

- Client persistence: `/src/tbStores/persistence/`
- Server synchronization: `/src/tbStores/synchronization/`
- Project details store: `/src/tbStores/projectDetails/`
- Active projects context: `/src/context/ActiveProjectIdsContext.tsx`
- Store provider: `/src/components/ActiveProjectDetailsStoreProvider.tsx`
