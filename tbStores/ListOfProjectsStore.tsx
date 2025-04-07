import React, { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, createStore, NoValuesSchema, Value } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';
import { ProjectData, TBStatus } from '@/models/types';

const STORE_ID_PREFIX = 'projectListStore-';
const TABLES_SCHEMA = {
  projects: {
    _id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    jobTypeId: { type: 'string' },
    location: { type: 'string' },
    ownerName: { type: 'string' },
    startDate: { type: 'number' },
    plannedFinish: { type: 'number' },
    bidPrice: { type: 'number' },
    amountSpent: { type: 'number' },
    longitude: { type: 'number' },
    latitude: { type: 'number' },
    radius: { type: 'number' },
    favorite: { type: 'number' },
    thumbnail: { type: 'string' },
    jobStatus: { type: 'string' },
  },
} as const;

type ProjectsSchema = typeof TABLES_SCHEMA.projects;
type ProjectsCellId = keyof (typeof TABLES_SCHEMA)['projects'];

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useRowIds,
  useSetCellCallback,
  useSortedRowIds,
  useStore,
  useTable,
} = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => STORE_ID_PREFIX + '9999'; // Replace 9999 with an organization id.

/// Functions to create:
//  List all projects returning ProjectData[]. Pass in a status.
//  Add a new Project
//  Delete a project
//  Update a project property.

/**
 * Returns all projects for the current store ID.
 */
export const useAllProjects = () => {
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  let store = useStore(useStoreId());

  const fetchAllProjects = useCallback((): ProjectData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('projects');
    if (table) {
      const projects: ProjectData[] = Object.entries(table).map(([id, row]) => ({
        _id: id,
        code: row.code ?? '',
        name: row.name ?? '',
        jobTypeId: row.jobTypeId ?? '',
        location: row.location ?? '',
        ownerName: row.ownerName ?? '',
        startDate: Number(row.startDate) ?? 0,
        plannedFinish: Number(row.plannedFinish) ?? 0,
        bidPrice: row.bidPrice ?? 0,
        amountSpent: row.amountSpent ?? 0,
        longitude: row.longitude ?? 0,
        latitude: row.latitude ?? 0,
        radius: row.radius ?? 0,
        favorite: row.favorite ?? 0,
        thumbnail: row.thumbnail ?? '',
        jobStatus: row.jobStatus ?? '',
      }));

      return projects.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));
    }

    return [];
  }, [store]);

  useEffect(() => {
    setAllProjects(fetchAllProjects());
  }, [fetchAllProjects]);

  // Function to handle table data change
  const handleTableChange = () => {
    setAllProjects(fetchAllProjects());
  };

  useEffect(() => {
    if (!store) {
      return;
    }
    const listenerId = store.addTableListener('projects', handleTableChange);
    // Cleanup: Remove the listener when the component unmounts
    return () => {
      store.delListener(listenerId);
    };
  }, []);

  return allProjects;
};

// Returns a callback that adds a new project to the store.
export const useAddProjectCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (projectData: ProjectData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      projectData._id = id;

      console.log('(In callback). useAddProjectCallback storeid:', useStoreId());
      console.log(`Adding a new project with ID: ${id}, Name: ${projectData.name}`);
      if (store) {
        const storeCheck = store.setRow('projects', id, projectData);
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

// Returns a callback that deletes a project from the store.
export const useDeleteProjectCallback = (id: string) => useDelRowCallback('projects', id, useStoreId());

// Returns a pair of 1) a property of the vendor, 2) a callback that
// updates it, similar to the React useState pattern.
export const useProjectValue = <ValueId extends ProjectsCellId>(
  projectId: string,
  valueId: ValueId,
): [Value<ProjectsSchema, ValueId>, (value: Value<ProjectsSchema, ValueId>) => void] => [
  (useCell('projects', projectId, valueId, useStoreId()) as Value<ProjectsSchema, ValueId>) ??
    ('' as Value<ProjectsSchema, ValueId>),
  useSetCellCallback(
    'projects',
    projectId,
    valueId,
    (value: Value<ProjectsSchema, ValueId>) => value,
    [],
    useStoreId(),
  ),
];

// Create, persist, and sync a store containing the IDs of the projects
export default function ProjectsStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log(`Creating projects store with ID: ${storeId}`);
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  // In turn 'render' (i.e. create) all of the shopping lists themselves.
  return null;
}
