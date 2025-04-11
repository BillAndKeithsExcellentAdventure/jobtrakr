import { View, Text } from 'react-native';
import React from 'react';
import ConfigurationStore from '@/tbStores/configurationStore/ConfigurationStore';
import ProjectsStore from '@/tbStores/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';

const AuthorizedStoresProvider = () => {
  const { orgId } = useAuth();
  if (!orgId) return null;

  return (
    <>
      <ConfigurationStore />
      <ProjectsStore />
    </>
  );
};

export default AuthorizedStoresProvider;
