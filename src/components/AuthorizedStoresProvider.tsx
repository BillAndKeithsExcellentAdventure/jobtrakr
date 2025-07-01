import React, { PropsWithChildren, memo, useEffect } from 'react';
import ConfigurationStore from '@/src/tbStores/configurationStore/ConfigurationStore';
import ListOfProjectsStore from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';
import AppSettingsStore from '../tbStores/appSettingsStore/appSettingsStore';

export const AuthorizedStoresProvider = () => {
  const { orgId } = useAuth();

  if (!orgId) return null;

  return (
    <>
      <AppSettingsStore />
      <ConfigurationStore />
      <ListOfProjectsStore />
    </>
  );
};

export default AuthorizedStoresProvider;
