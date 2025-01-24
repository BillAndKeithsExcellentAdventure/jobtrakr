import { View, Text } from 'react-native';
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';

const CategoryPage = () => {
  const { category, jobId } = useLocalSearchParams<{ category: string; jobId: string }>();

  return (
    <View>
      <Stack.Screen options={{ headerShown: true, title: `(${jobId}) / (${category}) Details`}} />

      <Text>{`CategoryPage category ${category} - job ${jobId}`}</Text>
    </View>
  );
};

export default CategoryPage;
