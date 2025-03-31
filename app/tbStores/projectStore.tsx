import { useCallback } from 'react';
import { randomUUID } from 'expo-crypto';
import { useRemoteRowId } from 'tinybase/ui-react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { Cell, createMergeableStore, createRelationships, Value } from 'tinybase/with-schemas';
import { Store } from 'tinybase/store';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';

const STORE_ID_PREFIX = 'projectStore-';

export interface ProjectData {
  projId: any;
  code?: string;
  name: string;
  jobTypeId?: string;
  location?: string;
  ownerName?: string;
  startDate?: Date;
  plannedFinish?: Date;
  bidPrice?: number;
  longitude?: number;
  latitude?: number;
  radius?: number;
  favorite?: number;
  thumbnail?: string;
  jobStatus?: string;
}

// TODO: Figure out how to generate schema from ProjectData. SchemaUtils.ts is not working as
//       expected. For now, we will manually define the schema.
//
// Override specific fields if needed
const VALUES_SCHEMA = {
  projId: { type: 'string' },
  code: { type: 'string' },
  name: { type: 'string' },
  jobTypeId: { type: 'string' },
  location: { type: 'string' },
  ownerName: { type: 'string' },
  startDate: { type: 'number' },
  plannedFinish: { type: 'number' },
  bidPrice: { type: 'number' },
  longitude: { type: 'number' },
  latitude: { type: 'number' },
  radius: { type: 'number' },
  favorite: { type: 'string' },
  thumbnail: { type: 'string' },
  jobStatus: { type: 'string' },
} as const;

const TABLES_SCHEMA = {
  categories: {
    id: { type: 'string' },
    name: { type: 'string' },
    code: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  items: {
    id: { type: 'string' },
    name: { type: 'string' },
    code: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  receipts: {
    id: { type: 'string' },
    name: { type: 'string' },
    code: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
} as const;

type Schemas = [typeof TABLES_SCHEMA, typeof VALUES_SCHEMA];
type ProjectDataId = keyof typeof VALUES_SCHEMA;
type CategoriesCellId = keyof (typeof TABLES_SCHEMA)['categories'];

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideRelationships,
  useProvideStore,
  useRowCount,
  useSetCellCallback,
  useSetValueCallback,
  useSortedRowIds,
  useStore,
  useCreateRelationships,
  useTable,
  useValue,
  useValuesListener,
} = UiReact as UiReact.WithSchemas<Schemas>;

const useStoreId = (projId: string) => STORE_ID_PREFIX + projId;

const useUserId = () => '8888-KMB'; // Replace with a userId

// Returns a pair of 1) a property of the shopping list, 2) a callback that
// updates it, similar to the React useState pattern.
export const useProjectValue = <ValueId extends ProjectDataId>(
  projId: string,
  valueId: ValueId,
): [Value<Schemas[1], ValueId>, (value: Value<Schemas[1], ValueId>) => void] => [
  useValue(valueId, useStoreId(projId)) ?? ('' as Value<Schemas[1], ValueId>),
  useSetValueCallback(valueId, (value: Value<Schemas[1], ValueId>) => value, [], useStoreId(projId)),
];

// Returns a callback that adds a new category to the project.
export const useAddCategoryCallback = (projId: string) => {
  const store = useStore(useStoreId(projId));
  const [userId] = useUserId();
  return useCallback(
    (name: string, code: number) => {
      const id = randomUUID();
      store?.setRow('categories', id, {
        id,
        name,
        code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return id;
    },
    [store, projId],
  );
};

// Returns a callback that deletes a catagory from the project
export const useDelCategoryCallback = (projId: string, catId: string) =>
  useDelRowCallback('categories', catId, useStoreId(projId));

// Returns the categories
export const useCategoryIds = (
  projId: string,
  cellId: CategoriesCellId = 'id',
  descending?: boolean,
  offset?: number,
  limit?: number,
) => useSortedRowIds('categories', cellId, descending, offset, limit, useStoreId(projId));

// Returns the number of products in the shopping list.
export const useCategoriesCount = (projId: string) => useRowCount('categories', useStoreId(projId));

// Create, persist, and sync a store containing the project and its categories.
export default function ProjectStore({
  projId,
  useProjectDataCopy,
}: {
  projId: string;
  useProjectDataCopy: (id: string) => [string, (projectDataCopy: string) => void];
}) {
  const storeId = useStoreId(projId);
  const [userId] = useUserId();
  const [projDataCopy, setProjDataCopy] = useProjectDataCopy(projId);

  const store = useCreateMergeableStore(() => createMergeableStore().setSchema(TABLES_SCHEMA, VALUES_SCHEMA));

  // Persist store (with initial content if it hasn't been saved before), then
  // ensure the current user is added as a collaborator.
  useCreateClientPersisterAndStart(storeId, store, projDataCopy);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  return null;
}
