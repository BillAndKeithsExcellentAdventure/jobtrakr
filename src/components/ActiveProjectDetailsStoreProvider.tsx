import React, { PropsWithChildren, useMemo } from 'react';
import { useActiveProjectIds } from '../context/ActiveProjectIdsContext';
import { useRowIds } from 'tinybase/ui-react';
import ProjectDetailsStore from '../tbStores/projectDetails/ProjectDetailsStore';
import { useProjectListStoreId } from '../tbStores/listOfProjects/ListOfProjectsStore';
import { ProjectDetailsStoreCacheProvider } from '../context/ProjectDetailsStoreCacheContext';

const ActiveProjectDetailsStoreProvider = ({ children }: PropsWithChildren) => {
  const { activeProjectIds } = useActiveProjectIds();
  const storeId = useProjectListStoreId();
  const allAvailableProjectIds = useRowIds('projects', storeId);

  // Use useMemo to compute the filtered project IDs
  const projectDetailsStoresToBuild = useMemo(() => {
    if (!allAvailableProjectIds.length) {
      return [];
    }

    // Filter for projects that are both available and active
    return allAvailableProjectIds.filter((id) => activeProjectIds.includes(id));
  }, [activeProjectIds, allAvailableProjectIds]);

  if (projectDetailsStoresToBuild.length === 0) {
    return <ProjectDetailsStoreCacheProvider>{children}</ProjectDetailsStoreCacheProvider>;
  }

  // Render ProjectDetailsStore components for each project
  return (
    <ProjectDetailsStoreCacheProvider>
      {projectDetailsStoresToBuild.map((id) => (
        <ProjectDetailsStore projectId={id} key={id} />
      ))}
      {children}
    </ProjectDetailsStoreCacheProvider>
  );
};

export default ActiveProjectDetailsStoreProvider;
