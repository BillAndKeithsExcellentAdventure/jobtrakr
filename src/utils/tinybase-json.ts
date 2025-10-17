/**
 * Utilities to export/import a TinyBase store to/from a JSON-serializable object.
 *
 * These functions try to be compatible with a few TinyBase API shapes by probing
 * for commonly available methods (getTableIds, getTable, setTable, tables map).
 *
 * Usage:
 *   const json = exportTinyBaseStore(store);
 *   const text = JSON.stringify(json); // write to file
 *   // later...
 *   const parsed = JSON.parse(text);
 *   await importFromJson(store, parsed);
 */

type TinyBaseStoreLike = any;

export function exportTinyBaseStore(store: TinyBaseStoreLike) {
  const tableIds: string[] = getTableIdsFromStore(store);
  const out: { version: number; tables: Record<string, Record<string, Record<string, any>>> } = {
    version: 1,
    tables: {},
  };

  for (const tableId of tableIds) {
    const rows = getTableRowsFromStore(store, tableId);
    const serialRows: Record<string, Record<string, any>> = {};

    // rows may be Map<rowId, Map<cellId, value>> or Record<rowId, Record<cellId, value>>
    if (rows instanceof Map) {
      for (const [rowId, row] of rows.entries()) {
        if (row instanceof Map) {
          serialRows[rowId] = Object.fromEntries(row.entries());
        } else {
          // row might be plain object
          serialRows[rowId] = { ...(row || {}) };
        }
      }
    } else if (typeof rows === 'object' && rows !== null) {
      for (const rowId of Object.keys(rows)) {
        const row = rows[rowId];
        if (row instanceof Map) {
          serialRows[rowId] = Object.fromEntries(row.entries());
        } else {
          serialRows[rowId] = { ...(row || {}) };
        }
      }
    } else {
      // unknown shape - skip
      continue;
    }

    out.tables[tableId] = serialRows;
  }

  return out;
}

export async function importFromJson(
  store: TinyBaseStoreLike,
  data: any,
  options?: { clearExisting?: boolean },
) {
  if (!data || typeof data !== 'object') {
    throw new Error('importFromJson: invalid data');
  }
  const { version = 1, tables = {} } = data;
  if (version !== 1) {
    // For now only support version 1
    throw new Error(`importFromJson: unsupported version ${version}`);
  }

  const clearExisting = options?.clearExisting ?? true;

  // Clear existing tables (best-effort)
  if (clearExisting) {
    const existingTableIds = getTableIdsFromStore(store);
    for (const tableId of existingTableIds) {
      // Prefer deleteTable if available
      if (typeof store.deleteTable === 'function') {
        try {
          store.deleteTable(tableId);
          continue;
        } catch {
          // fall through
        }
      }

      // Prefer setTable(tableId, {}) if available
      if (typeof store.setTable === 'function') {
        try {
          store.setTable(tableId, {});
          continue;
        } catch {
          // fall through
        }
      }

      // Last resort: mutate tables map if present
      if (store.tables && typeof store.tables === 'object') {
        delete store.tables[tableId];
      }
    }
  }

  // Create tables from data
  for (const tableId of Object.keys(tables)) {
    const rowsObj = tables[tableId] as Record<string, Record<string, any>>;

    // Convert each row into either plain object or Maps depending on store API
    // Prefer calling setTable(tableId, rowsObject) if available.
    if (typeof store.setTable === 'function') {
      try {
        // Many TinyBase versions accept a plain record of rows
        store.setTable(tableId, rowsObj);
        continue;
      } catch {
        // fall through to manual population
      }
    }

    // If store.setTableRow or setCell APIs exist, try to populate rows/cells manually
    if (typeof store.setRow === 'function') {
      // hypothetical API: setRow(tableId, rowId, rowObject)
      for (const rowId of Object.keys(rowsObj)) {
        store.setRow(tableId, rowId, rowsObj[rowId]);
      }
      continue;
    }

    if (typeof store.setCell === 'function') {
      // populate cell-by-cell
      for (const rowId of Object.keys(rowsObj)) {
        const row = rowsObj[rowId];
        for (const cellId of Object.keys(row)) {
          store.setCell(tableId, rowId, cellId, row[cellId]);
        }
      }
      continue;
    }

    // As last resort, try to place the table into store.tables map
    if (!store.tables || typeof store.tables !== 'object') {
      store.tables = {};
    }
    // Some TinyBase shapes expect Map for rows/cells; use plain objects which are JSON-serializable
    store.tables[tableId] = rowsObj;
  }

  // Some TinyBase stores have async/commit semantics; if there's a flush/commit, call it
  if (typeof store.commit === 'function') {
    try {
      await store.commit();
    } catch {
      // ignore commit errors
    }
  }

  return true;
}

/* Helper functions to probe the store shape */

function getTableIdsFromStore(store: TinyBaseStoreLike): string[] {
  if (!store) return [];
  if (typeof store.getTableIds === 'function') {
    try {
      const ids = store.getTableIds();
      if (Array.isArray(ids)) return ids;
      // some implementations return an iterator
      if (ids && typeof ids[Symbol.iterator] === 'function') return Array.from(ids as Iterable<string>);
    } catch {
      /* fallthrough */
    }
  }

  if (typeof store.getTables === 'function') {
    try {
      const tables = store.getTables();
      if (tables && typeof tables === 'object') return Object.keys(tables);
    } catch {
      /* fallthrough */
    }
  }

  if (store.tables && typeof store.tables === 'object') {
    return Object.keys(store.tables);
  }

  // Try to infer from forEachTable
  if (typeof store.forEachTable === 'function') {
    const ids: string[] = [];
    try {
      store.forEachTable((tableId: string) => ids.push(tableId));
      return ids;
    } catch {
      /* fallthrough */
    }
  }

  return [];
}

function getTableRowsFromStore(store: TinyBaseStoreLike, tableId: string): any {
  if (typeof store.getTable === 'function') {
    try {
      return store.getTable(tableId);
    } catch {
      /* fallthrough */
    }
  }

  if (typeof store.getTableRows === 'function') {
    try {
      return store.getTableRows(tableId);
    } catch {
      /* fallthrough */
    }
  }

  if (store.tables && typeof store.tables === 'object') {
    return store.tables[tableId];
  }

  // Last resort: try store.table(tableId)
  if (typeof store.table === 'function') {
    try {
      return store.table(tableId);
    } catch {
      /* fallthrough */
    }
  }

  return {};
}
