import { NoValuesSchema, Value } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './appSettingsStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useRowIds,
  useSetCellCallback,
  useSetValueCallback,
  useSortedRowIds,
  useStore,
  useRow,
  useTable,
  useValue,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { CrudResult } from '@/src/models/types';

export interface SettingsData {
  id: string;
  companyName: string;
  ownerName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  companyLogo: string;
  changeOrderTemplateFileName: string;
}

const INITIAL_SETTINGS: SettingsData = {
  id: '',
  companyName: '',
  ownerName: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  email: '',
  phone: '',
  companyLogo: '',
  changeOrderTemplateFileName: '',
};

// --- READ App Settings ---
export const useAppSettings = (): SettingsData => {
  const store = useStore(useStoreId());
  const [row, setRow] = useState<SettingsData>(INITIAL_SETTINGS);

  const fetchRow = useCallback(() => {
    if (!store) return INITIAL_SETTINGS;
    const table = store.getTable('settings');
    const array = table
      ? (Object.entries(table).map(([id, row]) => ({
          ...row,
          id: id,
        })) as SettingsData[])
      : [];
    return array.length > 0 ? array[0] : INITIAL_SETTINGS;
  }, [store]);

  useEffect(() => {
    setRow(fetchRow());
  }, [fetchRow]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener('settings', () => setRow(fetchRow()));
    return () => {
      store.delListener(listenerId);
    };
  }, [store, fetchRow]);

  return row;
};

// --- UPDATE or ADD ROW ---
export function setAppSettingsCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (settings: Partial<SettingsData>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      let existing = INITIAL_SETTINGS;
      let id = randomUUID();
      if (settings.id) {
        const row = store.getRow('settings', settings.id);
        if (row) {
          existing = { id: settings.id, ...row } as SettingsData;
          id = settings.id;
        }
      }

      const success = store.setRow('settings', id, { ...existing, ...settings });
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to store settings' };
    },
    [store],
  );
}
