import React, { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, createStore, NoValuesSchema } from 'tinybase/with-schemas';
import { ProjectData } from './projectStore';
import ProjectStore from './projectStore';
import { useCreateClientPersisterAndStart } from './persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from './synchronization/useCreateServerSynchronizerAndStart';

const STORE_ID_PREFIX = 'projectListStore-';
const TABLES_SCHEMA = {
  projects: {
    id: { type: 'string' },
    status: { type: 'string' },
    projectDataCopy: { type: 'string' },
  },
} as const;

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

const useStoreId = () => STORE_ID_PREFIX + '9999'; // Replace 9999 with a user id.

export const useGetProjectPropertyCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (id: string, propertyName: string) => {
      // Why do I have to do this?
      if (!store) {
        store = useStore(useStoreId());
      }
      if (store) {
        const row = store.getRow('projects', id);
        if (row) {
          const projectDataCopy = JSON.parse(row.projectDataCopy || '{}');
          if (!projectDataCopy) {
            return 'Error - Project Data Copy not found';
          }
          return projectDataCopy[propertyName];
        }
        return 'Error - Row not found';
      }
      return 'Error - Store not found';
    },
    [store],
  );
};

// Returns a callback that adds a new project to the store.
export const useNewProjectCallback = () => {
  let store = useStore(useStoreId());

  return useCallback(
    (projData: ProjectData) => {
      const id = randomUUID();
      projData.projId = id;
      console.log(
        `Adding a new project with ID: ${id}, Name: ${projData.name}, Owner: ${projData.ownerName}`,
      );
      if (store) {
        projData.projId = id;
        store.setRow('projects', id, {
          id,
          projectDataCopy: JSON.stringify(projData),
        });

        return id;
      }
      return 0;
    },
    [store],
  );
};

export const useProjectDataCopy = (id: string): [string, (projectDataCopy: string) => void] => [
  useCell('projects', id, 'projectDataCopy', useStoreId()) ?? '',
  useSetCellCallback(
    'projects',
    id,
    'projectDataCopy',
    (projectDataCopy: string) => projectDataCopy,
    [],
    useStoreId(),
  ),
];

// Returns a callback that deletes a project from the store.
export const useDelProjectCallback = (id: string) => useDelRowCallback('projects', id, useStoreId());

// Returns the IDs of all projects in the store.
export const useProjectIds = () => useRowIds('projects', useStoreId());

// Create, persist, and sync a store containing the IDs of the projects
export default function ProjectsStore() {
  const storeId = useStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  console.log(`Creating projects store with ID: ${storeId}`);
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  // In turn 'render' (i.e. create) all of the shopping lists themselves.
  return Object.entries(useTable('projects', storeId)).map(([projId]) => (
    <ProjectStore projId={projId} key={projId} useProjectDataCopy={useProjectDataCopy} />
  ));
}
