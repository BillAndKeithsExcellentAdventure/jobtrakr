import { View, Text, Button } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams, useFocusEffect, Link, Stack } from 'expo-router';

const JobPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  // useFocusEffect(useCallback(() => {console.log('Tab focused')}, []));

  return (
    <View>
      <Stack.Screen options={{ headerShown: true, title: `Job (${id}) Details` }} />
      <Button
        title={`Catergory JobId = ${id}`}
        onPress={() => router.push(`/(tabs)/job/details/category/123?jobId=${id}`)}
      />
    </View>
  );
};

export default JobPage;
