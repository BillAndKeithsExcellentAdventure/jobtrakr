import React, { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, createStore, NoValuesSchema, Row, Value } from 'tinybase/with-schemas';
import { ProjectData } from './projectStore';
import ProjectStore from './projectStore';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';

export interface WorkItemData {
  _id: string;
  catId: string;
  code: string;
  name: string;
  estPrice: number;
  status: string;
}

export interface CategoryData {
  _id: string;
  code: string;
  name: string;
  estPrice: number;
  status: string;
}

const STORE_ID_PREFIX = 'CategoriesStore-';
const TABLES_SCHEMA = {
  categories: {
    _id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string' },
  },
  workItems: {
    _id: { type: 'string' },
    catId: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string' },
  },
} as const;

type CategorySchema = typeof TABLES_SCHEMA.categories;
type CategoriesCellId = keyof (typeof TABLES_SCHEMA)['categories'];
type WorkItemsCellId = keyof (typeof TABLES_SCHEMA)['workItems'];

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
  useTable,
  useValue,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => STORE_ID_PREFIX + '9999'; // Replace 9999 with a user id.

export const useCategoryPropertyCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    // ask bill, is this the right of doing things?
    (id: string, propertyName: keyof typeof TABLES_SCHEMA.categories) => {
      // Why do I have to do this?
      if (!store) {
        store = useStore(useStoreId());
      }
      if (store) {
        const cell = store.getCell('categories', id, propertyName);
        if (cell) {
          return cell;
        }
        return 'Error - cell not found';
      }
      return 'Error - Store not found';
    },
    [store],
  );
};

// Returns a pair of 1) a property of the shopping list, 2) a callback that
// updates it, similar to the React useState pattern.
export const useCategoryValue = <ValueId extends CategoriesCellId>(
  catId: string,
  valueId: ValueId,
): [Value<CategorySchema, ValueId>, (value: Value<CategorySchema, ValueId>) => void] => [
  (useCell('categories', catId, valueId, useStoreId()) as Value<CategorySchema, ValueId>) ??
    ('' as Value<CategorySchema, ValueId>),
  useSetCellCallback(
    'categories',
    catId,
    valueId,
    (value: Value<CategorySchema, ValueId>) => value,
    [],
    useStoreId(),
  ),
];

// Returns a callback that adds a new project to the store.
export const useNewCategoryCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (catData: CategoryData) => {
      const id = randomUUID();
      catData._id = id;
      console.log(`Adding a new category with ID: ${id}, Name: ${catData.name}, Code: ${catData.code}`);
      if (store) {
        const { estPrice, ...data } = catData;
        store.setRow('categories', id, data);

        return id;
      }
      return 0;
    },
    [store],
  );
};

// Returns a callback that deletes a category from the store.
export const useDelCategoryCallback = (id: string) => useDelRowCallback('categories', id, useStoreId());

// Returns the IDs of all categories in the store.
export const useCategoryIds = () => useRowIds('categories', useStoreId());

// Returns a callback that adds a new project to the store.
export const useNewWorkItemCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (workItemData: WorkItemData) => {
      const id = randomUUID();
      workItemData._id = id;
      console.log(
        `Adding a new workItem with ID: ${id}, Name: ${workItemData.name}, Code: ${workItemData.code}`,
      );
      if (store) {
        const { estPrice, ...data } = workItemData;
        store.setRow('workItems', id, data);

        return id;
      }
      return 0;
    },
    [store],
  );
};

export const useWorkItemPropertyCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    // ask bill, is this the right of doing things?
    (id: string, propertyName: keyof typeof TABLES_SCHEMA.workItems) => {
      // Why do I have to do this?
      if (!store) {
        store = useStore(useStoreId());
      }
      if (store) {
        const cell = store.getCell('workItems', id, propertyName);
        if (cell) {
          return cell;
        }
        return 'Error - cell not found';
      }
      return 'Error - Store not found';
    },
    [store],
  );
};

// Returns a callback that deletes a workItem from the store.
export const useDelWorkItemCallback = (id: string) => useDelRowCallback('workItems', id, useStoreId());

// Returns the IDs of all workItems in the store for the given category.
export const useWorkItemIds = (catId: string) => {
  const ids = useRowIds('workItems', useStoreId());
  return ids.filter((id) => useCell('workItems', id, 'catId') === catId);
};

// Create, persist, and sync a store containing ALL the categories defined by the user.
export default function CategoriesStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log(`Creating categories store with ID: ${storeId}`);
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);
}
