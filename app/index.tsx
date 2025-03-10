import React, { useEffect } from 'react';
import { Redirect, useRouter, useSegments } from 'expo-router';
import { useAuthSession } from '@/context/AuthSessionContext';

const IndexPage = () => {
  const { sessionUser } = useAuthSession();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!sessionUser) return;

    const inTabsGroup = segments[0] === '(auth)';

    console.log('User changed: ', sessionUser);

    if (sessionUser && !inTabsGroup) {
      router.replace('/jobs');
    } else {
      router.replace('/(auth)/auth');
    }
  }, [sessionUser]);

  if (!sessionUser) return <Redirect href="/(auth)/auth" />;

  return <Redirect href="/jobs" />;
};

export default IndexPage;
