import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export const unstable_settings = {
  initialRouteName: 'index',
};
const ProjectsLayout = () => {
  const auth = useAuth();

  if (!auth || !auth.isLoaded) {
    return null;
  }

  if (auth.isSignedIn && auth.orgId) {
    return (
      <Stack
        screenOptions={{ headerShown: true, headerBackTitle: '', headerBackButtonDisplayMode: 'minimal' }}
      />
    );
  }

  return <Redirect href="/sign-in" />;
};

export default ProjectsLayout;
