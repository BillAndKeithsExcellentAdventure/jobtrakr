import React, { useEffect } from 'react'
import { Redirect, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/session/ctx';

const IndexPage = () => {
  const { session } = useSession();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    const inTabsGroup = segments[0] === '(auth)';

    console.log('User changed: ', session);

    if (session && !inTabsGroup) {
      router.replace('/(tabs)/jobs');
    } else {
      router.replace('/(auth)/auth');
    }
  }, [session]);

  if (!session) return <Redirect href='/(auth)/auth' />;

  return <Redirect href='/(tabs)/jobs' />;
}

export default IndexPage
