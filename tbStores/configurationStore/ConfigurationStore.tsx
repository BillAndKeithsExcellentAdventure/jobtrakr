import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';
import { useAuth } from '@clerk/clerk-expo';

const STORE_ID_PREFIX = 'ConfigurationStore-';
export const TABLES_SCHEMA = {
  categories: {
    _id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string' },
  },
  workItems: {
    _id: { type: 'string' },
    categoryId: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string' },
  },
  templates: {
    _id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
  },
  templateWorkItems: {
    _id: { type: 'string' },
    templateId: { type: 'string' },
    workItemIds: { type: 'string' }, // Comma separated list of workItemIds
  },
  vendors: {
    _id: { type: 'string' },
    name: { type: 'string' },
    address: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
    mobilePhone: { type: 'string' },
    businessPhone: { type: 'string' },
    notes: { type: 'string' },
  },
} as const;

const { useCreateMergeableStore, useProvideStore } = UiReact as UiReact.WithSchemas<
  [typeof TABLES_SCHEMA, NoValuesSchema]
>;

export const useStoreId = () => {
  const { orgId } = useAuth();
  return STORE_ID_PREFIX + '_' + orgId;
};

// Create, persist, and sync a store containing ALL the categories defined by the user.
export default function ConfigurationStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
  return null;
}
