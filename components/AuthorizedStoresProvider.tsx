import { View, Text } from 'react-native';
import React, { PropsWithChildren } from 'react';
import ConfigurationStore from '@/tbStores/configurationStore/ConfigurationStore';
import ListOfProjectsStore from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';

export function AuthorizedStoresProvider({ children }: PropsWithChildren) {
  const { orgId } = useAuth();
  if (!orgId) return null;

  console.log(`AuthorizedStoresProvider orgId=${orgId}`);

  return (
    <>
      <ConfigurationStore />
      <ListOfProjectsStore />
      {children}
    </>
  );
}

export default AuthorizedStoresProvider;
