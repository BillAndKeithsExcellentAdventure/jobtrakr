import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

const STORE_ID_PREFIX = 'PHV1_AppSettingsStore';
export const TABLES_SCHEMA = {
  settings: {
    id: { type: 'string' },
    companyName: { type: 'string' },
    ownerName: { type: 'string' },
    address: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    companyLogo: { type: 'string' },
    changeOrderTemplateFileName: { type: 'string' },
    debugForceOffline: { type: 'boolean', default: false },
    syncWithQuickBooks: { type: 'boolean', default: false },
  },
} as const;

const { useCreateMergeableStore, useProvideStore } = UiReact as UiReact.WithSchemas<
  [typeof TABLES_SCHEMA, NoValuesSchema]
>;

export const useStoreId = () => {
  const { orgId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${orgId}`, [orgId]);
  return storeId;
};

// Create, persist, and sync a store containing ALL the categories defined by the user.
export default function AppSettingsStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
