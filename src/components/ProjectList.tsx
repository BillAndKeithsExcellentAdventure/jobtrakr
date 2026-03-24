import { ActionButtonProps } from '@/src/components/ButtonBar';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ProjectListEntry } from './ProjectListEntry';
import { FlatList } from 'react-native-gesture-handler';

// Define types for the props
export interface ProjectListEntryProps {
  projectId: string;
  projectName: string;
  imageUri?: string;
  location?: string;
  ownerName?: string;
  startDate: string;
  finishDate: string;
  bidPrice: number;
  amountSpent: number;
  isFavorite?: boolean;
  isCompanyExpenseProject?: boolean;
}

export function ProjectList({
  data,
  onPress,
  buttons,
}: {
  data: ProjectListEntryProps[];
  onPress: (item: ProjectListEntryProps) => void;
  buttons: ActionButtonProps[] | ((item: ProjectListEntryProps) => ActionButtonProps[]) | null | undefined;
}) {
  let showsVerticalScrollIndicator = false;
  if (Platform.OS === 'web') {
    showsVerticalScrollIndicator = true;
  }

  const colors = useColors();

  if (Platform.OS === 'web') {
    colors.listBackground = '#efefef';
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
      <FlatList
        style={[styles.flatList, { backgroundColor: colors.listBackground }]}
        data={data}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyExtractor={(item) => item.projectId}
        renderItem={({ item }) => {
          const resolvedButtons = typeof buttons === 'function' ? buttons(item) : buttons;
          return <ProjectListEntry item={item} onPress={onPress} buttons={resolvedButtons} />;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  flatList: {
    flex: 1,
    padding: 10,
    width: '100%',
  },
});
