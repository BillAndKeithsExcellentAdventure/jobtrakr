/* TODO
import { useStore } from '@tinybase/react';
import { useCallback } from 'react';

type CrudResult = { status: 'Success' | 'Error'; id: string; msg: string };

export function useAddRowCallback<T>(tableId: string) {
  const store = useStore();
  return useCallback(
    (id: string, data: T): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const success = store.setRow(tableId, id, data);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to write' };
    },
    [store, tableId],
  );
}

export function useUpdateRowCallback<T>(tableId: string) {
  const store = useStore();
  return useCallback(
    (id: string, updates: Partial<T>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const existing = store.getRow(tableId, id);
      if (!existing) return { status: 'Error', id: '0', msg: 'Row not found' };
      const success = store.setRow(tableId, id, { ...existing, ...updates });
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to update' };
    },
    [store, tableId],
  );
}

export function useDeleteRowCallback(tableId: string) {
  const store = useStore();
  return useCallback(
    (id: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const success = store.delRow(tableId, id);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to delete' };
    },
    [store, tableId],
  );
}

export function useTypedRow<T>(tableId: string, id: string): T | undefined {
  return useRow(tableId, id) as T | undefined;
}

export function useCrudAndValue<T>(tableId: string) {
  return {
    add: useAddRowCallback<T>(tableId),
    update: useUpdateRowCallback<T>(tableId),
    remove: useDeleteRowCallback(tableId),
    get: (id: string) => useTypedRow<T>(tableId, id),
  };
}
*/
/*
// vendors/hooks.ts
import { useAddRowCallback, useUpdateRowCallback, useDeleteRowCallback } from '../utils/tinybaseHooks';
import { TABLES } from '../ConfigurationStore.types';
import { VendorData } from './types';

export const useAddVendorCallback = () => useAddRowCallback<VendorData>(TABLES.vendors);
export const useUpdateVendorCallback = () => useUpdateRowCallback<VendorData>(TABLES.vendors);
export const useDeleteVendorCallback = () => useDeleteRowCallback(TABLES.vendors);



const {
  add: addVendor,
  update: updateVendor,
  get: useVendorValue,
} = useCrudAndValue<VendorData>(TABLES.vendors);
*/
