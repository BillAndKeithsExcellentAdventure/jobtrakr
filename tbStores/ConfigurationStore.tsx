import React, { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { Cell, createMergeableStore, createStore, NoValuesSchema, Row, Value } from 'tinybase/with-schemas';
import { ProjectData } from './projectStore';
import ProjectStore from './projectStore';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';
import {
  JobTemplateData,
  JobTemplateWorkItemData,
  TBStatus,
  VendorData,
  WorkCategoryData,
  WorkItemData as WorkItemData,
} from '@/models/types';

const STORE_ID_PREFIX = 'ConfigurationStore-';
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

type CategorySchema = typeof TABLES_SCHEMA.categories;
type WorkItemsSchema = typeof TABLES_SCHEMA.workItems;
type TemplateSchema = typeof TABLES_SCHEMA.templates;
type VendorsSchema = typeof TABLES_SCHEMA.vendors;
type CategoriesCellId = keyof (typeof TABLES_SCHEMA)['categories'];
type WorkItemsCellId = keyof (typeof TABLES_SCHEMA)['workItems'];
type TemplatesCellId = keyof (typeof TABLES_SCHEMA)['templates'];
type VendorsCellId = keyof (typeof TABLES_SCHEMA)['vendors'];

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

const useStoreId = () => STORE_ID_PREFIX + '9999'; // Replace 9999 with a organization id.

// Create, persist, and sync a store containing ALL the categories defined by the user.
export default function ConfigurationStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log(`Creating categories store with ID: ${storeId} ${store}`);
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  return null;
}

///////////////////////////////////////////////////////////////////////////////
// Vendors related hooks
///////////////////////////////////////////////////////////////////////////////
// Needed Functions:
//    useAllVendors
//    useAddVendorCallback
//    useVendorValue
//    useDeleteVendorCallback
//
/**
 * Returns all vendors for the current store ID.
 */
export const useAllVendors = () => {
  const [allVendors, setAllVendors] = useState<VendorData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllVendors = useCallback((): VendorData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('vendors');
    if (table) {
      const vendors: VendorData[] = Object.entries(table).map(([id, row]) => ({
        _id: id,
        name: row.name ?? '',
        address: row.address ?? '',
        city: row.city ?? '',
        state: row.state ?? '',
        zip: row.zip ?? '',
        mobilePhone: row.mobilePhone ?? '',
        businessPhone: row.businessPhone ?? '',
        notes: row.notes ?? '',
      }));

      return vendors.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllVendors(fetchAllVendors());
  }, [fetchAllVendors]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllVendors(fetchAllVendors());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('vendors', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  return allVendors;
};

export const useVendorFromStore = (vendorId: string) => {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  let store = useStore(useStoreId());

  const fetchVendor = useCallback((): VendorData | null => {
    if (!store) {
      return null;
    }

    const row = store.getRow('vendors', vendorId);
    if (!row) {
      return null;
    }
    return {
      _id: row._id ?? '0',
      name: row.name ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      zip: row.zip ?? '',
      mobilePhone: row.mobilePhone ?? '',
      businessPhone: row.businessPhone ?? '',
      notes: row.notes ?? '',
    } as VendorData;
  }, [store, vendorId]);

  useEffect(() => {
    setVendor(fetchVendor());
  }, [fetchVendor]);

  return vendor; // Return the category or null if not found
};

// Returns a callback that adds a new vendor to the store.
export const useAddVendorCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (vendorData: VendorData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      vendorData._id = id;

      console.log('(In callback). useAddVendorCallback storeid:', useStoreId());
      console.log(`Adding a new vendor with ID: ${id}, Name: ${vendorData.name}`);
      if (store) {
        const storeCheck = store.setRow('vendors', id, vendorData);
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

// Returns a pair of 1) a property of the vendor, 2) a callback that
// updates it, similar to the React useState pattern.
export const useVendorValue = <ValueId extends VendorsCellId>(
  vendorId: string,
  valueId: ValueId,
): [Value<VendorsSchema, ValueId>, (value: Value<VendorsSchema, ValueId>) => void] => [
  (useCell('vendors', vendorId, valueId, useStoreId()) as Value<VendorsSchema, ValueId>) ??
    ('' as Value<VendorsSchema, ValueId>),
  useSetCellCallback(
    'vendors',
    vendorId,
    valueId,
    (value: Value<VendorsSchema, ValueId>) => value,
    [],
    useStoreId(),
  ),
];

// Returns a callback that updates an existing vendor to the store.
export const useUpdateVendorCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (id: string, vendorData: VendorData): { status: TBStatus; msg: string; id: string } => {
      vendorData._id = id;

      if (store) {
        const storeCheck = store.setRow('vendors', id, vendorData);
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

// Returns a callback that deletes a template from the store.
export const useDeleteVendorCallback = (id: string) => useDelRowCallback('vendors', id, useStoreId());

///////////////////////////////////////////////////////////////////////////////
// Template related hooks
///////////////////////////////////////////////////////////////////////////////
// Needed Functions:
//    useAllTemplates
//    useAddTemplateCallback
//    useTemplateValue
//    useDeleteTemplateCallback
//
/**
 * Returns all categories for the current store ID.
 */
export const useAllTemplates = () => {
  const [allTemplates, setAllTemplates] = useState<JobTemplateData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllTemplates = useCallback((): JobTemplateData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('templates');
    if (table) {
      const templates: JobTemplateData[] = Object.entries(table).map(([id, row]) => ({
        _id: id,
        name: row.name ?? '',
        description: row.description ?? '',
      }));

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllTemplates(fetchAllTemplates());
  }, [fetchAllTemplates]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllTemplates(fetchAllTemplates());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('templates', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  return allTemplates;
};

export const useTemplateFromStore = (templateId: string) => {
  const [template, setTemplate] = useState<JobTemplateData | null>(null);
  let store = useStore(useStoreId());

  const fetchTemplate = useCallback((): JobTemplateData | null => {
    if (!store) {
      return null;
    }

    const row = store.getRow('templates', templateId);
    if (!row) {
      return null;
    }

    const template: JobTemplateData = {
      _id: row._id ?? '0',
      name: row.name ?? '',
      description: row.description ?? '',
    };

    return template;
  }, [store, templateId]);

  useEffect(() => {
    setTemplate(fetchTemplate());
  }, [fetchTemplate]);

  return template; // Return the category or null if not found
};

// Returns a callback that adds a new template to the store.
export const useAddTemplateCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (templatesData: JobTemplateData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      templatesData._id = id;

      console.log(
        `Adding a new template with ID: ${id}, Name: ${templatesData.name}, Description: ${templatesData.description}`,
      );
      if (store) {
        const storeCheck = store.setRow('templates', id, templatesData);
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

// Returns a callback that updates an existing template to the store.
export const useUpdateTemplateCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (id: string, templateData: JobTemplateData): { status: TBStatus; msg: string; id: string } => {
      templateData._id = id;

      if (store) {
        const storeCheck = store.setRow('templates', id, templateData);
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

// Returns a pair of 1) a property of the template, 2) a callback that
// updates it, similar to the React useState pattern.
export const useTemplateValue = <ValueId extends TemplatesCellId>(
  templateId: string,
  valueId: ValueId,
): [Value<TemplateSchema, ValueId>, (value: Value<TemplateSchema, ValueId>) => void] => [
  (useCell('templates', templateId, valueId, useStoreId()) as Value<TemplateSchema, ValueId>) ??
    ('' as Value<TemplateSchema, ValueId>),
  useSetCellCallback(
    'templates',
    templateId,
    valueId,
    (value: Value<TemplateSchema, ValueId>) => value,
    [],
    useStoreId(),
  ),
];

// Returns a callback that deletes a template from the store.
export const useDeleteTemplateCallback = (id: string) => useDelRowCallback('templates', id, useStoreId());

///////////////////////////////////////////////////////////////////////////////
// Template Items related hooks
///////////////////////////////////////////////////////////////////////////////
// Needed Functions:
//     useAllTemplateWorkItems(templateId: string)
//     useAddTemplateWorkItemCallback
//     useDeleteTemplateWorkItemCallback
//
/**
 * Returns all categories for the current store ID.
 */
export const useTemplateWorkItemData = (templateId: string) => {
  const [templateWorkItemData, setTemplateWorkItemData] = useState<JobTemplateWorkItemData | null>();
  const [templateWorkItemIds, setTemplateWorkItemIds] = useState<string[]>([]);
  let store = useStore(useStoreId());

  const fetchTemplateWorkItemData = useCallback((): JobTemplateWorkItemData | null => {
    if (!store) {
      return null;
    }

    const table = store.getTable('templateWorkItems');
    if (table) {
      const row = Object.entries(table).find(([id, row]) => row.templateId === templateId);
      if (row) {
        const [id, rowData] = row;
        return {
          _id: id,
          templateId: rowData.templateId ?? '',
          workItemIds: rowData.workItemIds ?? '',
        } as JobTemplateWorkItemData;
      }
    }

    return null;
  }, [store, templateId]);

  useEffect(() => {
    setTemplateWorkItemData(fetchTemplateWorkItemData());
  }, [fetchTemplateWorkItemData]);

  // Function to handle table data change
  const handleTableChange = () => {
    setTemplateWorkItemData(fetchTemplateWorkItemData());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('templateWorkItems', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  useEffect(() => {
    if (templateWorkItemData) {
      const workItemIds = templateWorkItemData.workItemIds.split(',');
      setTemplateWorkItemIds(workItemIds);
    }
  }, [templateWorkItemData]);

  const toggleWorkItemId = useCallback(
    (workItemId: string) => {
      const updatedWorkItemIds = templateWorkItemIds.includes(workItemId)
        ? templateWorkItemIds.filter((id) => id !== workItemId)
        : [...templateWorkItemIds, workItemId];

      // create a comma separated list of workItemIds
      const workItemIdsString = updatedWorkItemIds.join(',');

      //update the store
      if (store) {
        store.setRow('templateWorkItems', templateId, {
          _id: templateId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [templateWorkItemIds, store, templateId],
  );

  const setActiveWorkItemIds = useCallback(
    (workItemIds: string[]) => {
      const workItemIdsString = workItemIds.join(',');

      if (store) {
        store.setRow('templateWorkItems', templateId, {
          _id: templateId,
          templateId: templateId,
          workItemIds: workItemIdsString,
        });
      }
    },
    [store, templateId],
  );

  return { templateWorkItemIds, toggleWorkItemId, setActiveWorkItemIds }; // Return the template work item data or null if not found
};

// Returns a callback that adds a new template to the store.
export const useAddTemplateWorkItemDataCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (templateId: string, activeWorkItemIds: string): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();

      console.log(
        `Adding following WorkItemData id= ${id} to template : ${templateId} with templateWorkItemIds=[${activeWorkItemIds}]`,
      );
      if (store) {
        const storeCheck = store.setRow('templateWorkItems', id, {
          _id: id,
          templateId,
          workItemIds: activeWorkItemIds,
        });
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

// Returns a callback that deletes a template workItem from the store.
export const useDeleteTemplateWorkItemCallback = (id: string) => {
  useDelRowCallback('templateWorkItems', id, useStoreId());
};

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

// Returns a pair of 1) a property of the category list, 2) a callback that
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

  return useCallback(
    (id: string, catData: WorkCategoryData): { status: TBStatus; msg: string; id: string } => {
      catData._id = id;

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
export const useDeleteCategoryCallback = (id: string) => useDelRowCallback('categories', id, useStoreId());

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
