import React from 'react';
import ConfigurationStore from '@/src/tbStores/configurationStore/ConfigurationStore';
import ListOfProjectsStore from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';
import AppSettingsStore from '../tbStores/appSettingsStore/appSettingsStore';
import FailedToUploadSyncStore from '../tbStores/UploadSyncStore';

export const AuthorizedStoresProvider = () => {
  const { orgId } = useAuth();

  if (!orgId) return null;

  return (
    <>
      <AppSettingsStore />
      <ConfigurationStore />
      <ListOfProjectsStore />
      <FailedToUploadSyncStore />
    </>
  );
};

export default AuthorizedStoresProvider;
