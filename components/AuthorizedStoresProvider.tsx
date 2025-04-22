import { View, Text } from 'react-native';
import React from 'react';
import ConfigurationStore from '@/tbStores/configurationStore/ConfigurationStore';
import ListOfProjectsStore from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';

const AuthorizedStoresProvider = () => {
  const { orgId } = useAuth();
  if (!orgId) return null;

  return (
    <>
      <ConfigurationStore />
      <ListOfProjectsStore />
    </>
  );
};

export default AuthorizedStoresProvider;
