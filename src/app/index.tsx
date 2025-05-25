import React, { useEffect } from 'react';
import { Redirect, useRouter, useSegments } from 'expo-router';

const IndexPage = () => {
  return <Redirect href="/(auth)/sign-in" />;
};

export default IndexPage;
