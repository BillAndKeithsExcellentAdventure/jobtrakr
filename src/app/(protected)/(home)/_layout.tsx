import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export const unstable_settings = {
  initialRouteName: 'index',
};
const ProjectsLayout = () => {
  const { isLoaded, isSignedIn, orgId } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn && orgId) {
    return (
      <Stack
        screenOptions={{ headerShown: true, headerBackTitle: '', headerBackButtonDisplayMode: 'minimal' }}
      />
    );
  }

  return <Redirect href="/sign-in" />;
};

export default ProjectsLayout;
