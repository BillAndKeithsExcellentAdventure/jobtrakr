import React, { PropsWithChildren, memo, useEffect } from 'react';
import ConfigurationStore from '@/src/tbStores/configurationStore/ConfigurationStore';
import ListOfProjectsStore from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';

export const AuthorizedStoresProvider = ({ children }: PropsWithChildren) => {
  const { orgId } = useAuth();

  if (!orgId) return null;

  return (
    <>
      <ConfigurationStore />
      <ListOfProjectsStore />
      {children}
    </>
  );
};

export default AuthorizedStoresProvider;
