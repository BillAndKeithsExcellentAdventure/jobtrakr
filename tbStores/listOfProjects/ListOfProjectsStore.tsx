import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, createStore, NoValuesSchema, Value } from 'tinybase/with-schemas';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';
import { CrudResult, ProjectData, TBStatus } from '@/models/types';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import ProjectDetailsStore from '../projectDetails/ProjectDetailsStore';
import { useAuth } from '@clerk/clerk-expo';

const STORE_ID_PREFIX = 'PHV1_projectListStore';
const TABLES_SCHEMA = {
  projects: {
    id: { type: 'string' },
    name: { type: 'string' },
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
    status: { type: 'string' },
    seedWorkItems: { type: 'string' }, // comma separated list of workItemIds
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

const useProjectListStoreId = () => {
  const { orgId } = useAuth();
  const storeId = useMemo(() => `${STORE_ID_PREFIX}_${orgId}`, [orgId]);
  return storeId;
};

/**
 * Returns all projects for the current store ID.
 */
export const useAllProjects = () => {
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  let store = useStore(useProjectListStoreId());

  const fetchAllProjects = useCallback((): ProjectData[] => {
    if (!store) {
      return []; // Return an empty array if the store is not available
    }

    const table = store.getTable('projects');
    if (table) {
      const projects: ProjectData[] = Object.entries(table).map(
        ([id, row]) =>
          ({
            ...row,
            id: id,
          } as ProjectData),
      );

      return projects.sort((a, b) => (b.favorite ?? 0) - (a.favorite ?? 0));
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
  let store = useStore(useProjectListStoreId());

  return useCallback(
    (projectData: ProjectData): { status: TBStatus; msg: string; id: string } => {
      const id = randomUUID();
      projectData.id = id;

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

export const useProject = (id: string): ProjectData | undefined => {
  const store = useStore(useProjectListStoreId());
  if (!store) return undefined;

  const row = store.getRow('projects', id);
  if (!row) return undefined;

  return { id, ...row } as ProjectData;
};

// Returns a callback that deletes a project from the store.
export function useDeleteProjectCallback() {
  const store = useStore(useProjectListStoreId());
  return useCallback(
    (id: string): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const success = store.delRow('projects', id);
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to delete' };
    },
    [store],
  );
}

// Returns a pair of 1) a property of the vendor, 2) a callback that
// updates it, similar to the React useState pattern.
export const useProjectValue = <ValueId extends ProjectsCellId>(
  projectId: string,
  valueId: ValueId,
): [Value<ProjectsSchema, ValueId>, (value: Value<ProjectsSchema, ValueId>) => void] => [
  (useCell('projects', projectId, valueId, useProjectListStoreId()) as Value<ProjectsSchema, ValueId>) ??
    ('' as Value<ProjectsSchema, ValueId>),
  useSetCellCallback(
    'projects',
    projectId,
    valueId,
    (value: Value<ProjectsSchema, ValueId>) => value,
    [],
    useProjectListStoreId(),
  ),
];

// --- UPDATE ROW ---
export function useUpdateProjectCallback() {
  const store = useStore(useProjectListStoreId());
  if (!store) return undefined;

  return useCallback(
    (id: string, updates: Partial<ProjectData>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      const existing = store.getRow('projects', id);
      if (!existing) return { status: 'Error', id: '0', msg: 'Row not found' };
      const success = store.setRow('projects', id, { ...existing, ...updates });
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to update' };
    },
    [store],
  );
}

// Returns a callback that toggles the favorite status of a project.
export const useToggleFavoriteCallback = () => {
  let store = useStore(useProjectListStoreId());

  return useCallback(
    (projectId: string): { status: TBStatus; msg: string } => {
      if (store) {
        const currentValue = store.getCell('projects', projectId, 'favorite');
        const storeCheck = store.setCell('projects', projectId, 'favorite', currentValue ? 0 : 1);
        if (storeCheck) {
          return { status: 'Success', msg: '' };
        } else {
          return { status: 'Error', msg: 'Unable to setRow' };
        }
      } else {
        return { status: 'Error', msg: 'Store not found' };
      }
    },
    [store],
  );
};

// Create, persist, and sync a store containing the IDs of the projects
export default function ListOfProjectsStore() {
  const storeId = useProjectListStoreId();
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));
  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  // get all active projectIds from the ActiveProjectIdsContext
  const { activeProjectIds } = useActiveProjectIds();
  const allAvailableProjectIds = useRowIds('projects', storeId);

  const allProjectDetailsStoreToBuild = useMemo(() => {
    if (
      !activeProjectIds ||
      !allAvailableProjectIds ||
      allAvailableProjectIds.length === 0 ||
      activeProjectIds.length === 0
    ) {
      return [];
    }

    const filterProjectIds = allAvailableProjectIds.filter((id) => activeProjectIds.includes(id));
    return filterProjectIds;
  }, [activeProjectIds, allAvailableProjectIds]);

  if (allProjectDetailsStoreToBuild.length === 0) {
    return null;
  }

  // In turn 'render' (i.e. create) all of the active projectDetailStores for active projects.
  return allProjectDetailsStoreToBuild.map((id) => {
    console.log('Rendering ProjectDetailsStore for projectId:', id);
    return <ProjectDetailsStore projectId={id} key={id} />;
  });
}
