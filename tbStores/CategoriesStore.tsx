import React, { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { Cell, createMergeableStore, createStore, NoValuesSchema, Row, Value } from 'tinybase/with-schemas';
import { ProjectData } from './projectStore';
import ProjectStore from './projectStore';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';
import { TBStatus, WorkCategoryData, WorkCategoryItemData as WorkItemData } from '@/models/types';

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
    categoryId: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string' },
  },
} as const;

type CategorySchema = typeof TABLES_SCHEMA.categories;
type WorkItemsSchema = typeof TABLES_SCHEMA.workItems;
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

// Create, persist, and sync a store containing ALL the categories defined by the user.
export default function CategoriesStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log(`Creating categories store with ID: ${storeId} ${store}`);
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  return null;
}

///////////////////////////////////////////////////////////////////////////////
// Category related hooks
///////////////////////////////////////////////////////////////////////////////

/**
 * Returns all categories for the current store ID.
 */
export const useAllCategories = () => {
  const [allCategories, setAllCategories] = useState<WorkCategoryData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllCategories = useCallback((): WorkCategoryData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('categories');
    if (table) {
      const categories: WorkCategoryData[] = Object.entries(table).map(([id, row]) => ({
        _id: id,
        code: row.code ?? '',
        name: row.name ?? '',
        status: row.status ?? '',
      }));

      return categories.sort((a, b) => Number.parseInt(a.code ?? '0') - Number.parseInt(b.code ?? '0'));
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllCategories(fetchAllCategories());
  }, [fetchAllCategories]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllCategories(fetchAllCategories());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('categories', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  return allCategories;
};

export const useCategoryFromStore = (categoryId: string) => {
  const [category, setCategory] = useState<WorkCategoryData | null>(null);
  let store = useStore(useStoreId());

  const fetchCategory = useCallback((): WorkCategoryData | null => {
    if (!store) {
      return null;
    }

    const row = store.getRow('categories', categoryId);
    if (row) {
      return {
        _id: row._id ?? '0',
        name: row.name ?? '',
        code: row.code ?? '',
        status: row.status ?? '',
      } as WorkCategoryData;
    }

    return null;
  }, [store, categoryId]);

  useEffect(() => {
    setCategory(fetchCategory());
  }, [fetchCategory]);

  return category; // Return the category or null if not found
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

// Returns a callback that adds a new category to the store.
export const useAddCategoryCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (catData: WorkCategoryData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      catData._id = id;

      console.log('(In callback). useNewCategory storeid:', useStoreId());
      console.log(`Adding a new category with ID: ${id}, Name: ${catData.name}, Code: ${catData.code}`);
      if (store) {
        const storeCheck = store.setRow('categories', id, catData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that updates an existing category to the store.
export const useUpdateCategoryCallback = () => {
  let store = useStore(useStoreId());
  console.log('useUpdateCategory storeid:', useStoreId());

  return useCallback(
    (id: string, catData: WorkCategoryData): { status: TBStatus; msg: string; id: string } => {
      catData._id = id;

      console.log('(In callback). useUpdateCategory storeid:', useStoreId());
      console.log(`Updating a category with ID: ${id}, Name: ${catData.name}, Code: ${catData.code}`);
      if (store) {
        const storeCheck = store.setRow('categories', id, catData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that deletes a category from the store.
export const useDelCategoryCallback = (id: string) => useDelRowCallback('categories', id, useStoreId());

// Returns the IDs of all categories in the store.
export const useCategoryIds = () => useRowIds('categories', useStoreId());

///////////////////////////////////////////////////////////////////////////////
// Work Items related hooks
///////////////////////////////////////////////////////////////////////////////
export const useAllWorkItems = () => {
  const [allWorkItems, setAllWorkItems] = useState<WorkItemData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllWorkItems = useCallback((): WorkItemData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('workItems');
    if (!table) {
      return [];
    }

    const workItems: WorkItemData[] = Object.entries(table).map(([id, row]) => ({
      _id: row._id ?? '',
      categoryId: row.categoryId ?? '',
      code: row.code ?? '',
      name: row.name ?? '',
      status: row.status ?? '',
    }));

    return workItems.sort((a, b) => Number.parseInt(a.code ?? '0') - Number.parseInt(b.code ?? '0'));
  }, [store]);

  useEffect(() => {
    setAllWorkItems(fetchAllWorkItems());
  }, [fetchAllWorkItems]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllWorkItems(fetchAllWorkItems());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('workItems', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  return allWorkItems;
};

// Returns a pair of 1) a property of the shopping list, 2) a callback that
// updates it, similar to the React useState pattern.
export const useWorkItemValue = <ValueId extends WorkItemsCellId>(
  catId: string,
  valueId: ValueId,
): [Value<WorkItemsSchema, ValueId>, (value: Value<WorkItemsSchema, ValueId>) => void] => [
  (useCell('workItems', catId, valueId, useStoreId()) as Value<WorkItemsSchema, ValueId>) ??
    ('' as Value<WorkItemsSchema, ValueId>),
  useSetCellCallback(
    'workItems',
    catId,
    valueId,
    (value: Value<WorkItemsSchema, ValueId>) => value,
    [],
    useStoreId(),
  ),
];

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
        const { ...data } = workItemData;
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
    (id: string, propertyName: keyof typeof TABLES_SCHEMA.workItems) => {
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
  return ids.filter((id) => useCell('workItems', id, 'categoryId') === catId);
};

// Returns a callback that adds a new category item to the store.
export const useAddWorkItemCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (workItemData: WorkItemData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      workItemData._id = id;
      console.log(
        `Adding a new category item with ID: ${id}, catId: ${workItemData.categoryId} Name: ${workItemData.name}, Code: ${workItemData.code}`,
      );
      if (store) {
        const storeCheck = store.setRow('workItems', id, workItemData);
        if (storeCheck) {
          return { status: 'Success', msg: '', id };
        } else {
          return { status: 'Error', msg: 'Unable to setRow.', id: '0' };
        }
      } else {
        return { status: 'Error', msg: 'Unable to find store.', id: '0' };
      }
    },
    [store],
  );
};

// Returns a callback that adds a new category item to the store.
export const useUpdateWorkItemCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (id: string, workItemData: WorkItemData): { status: TBStatus; id: string } => {
      workItemData._id = id;
      console.log(
        `Updating a category item with ID: ${id}, catId: ${workItemData.categoryId} Name: ${workItemData.name}, Code: ${workItemData.code}`,
      );
      if (store) {
        const storeCheck = store.setRow('workItems', id, workItemData);
        if (storeCheck) {
          return { status: 'Success', id };
        }
      }

      return { status: 'Error', id: '0' };
    },
    [store],
  );
};
