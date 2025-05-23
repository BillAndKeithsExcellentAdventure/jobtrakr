import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import {
  useAllRows as useAllConfigRows,
  WorkItemDataCodeCompareAsNumber,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddRowCallback, useAllRows } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ItemData {
  id: string;
  code: string;
  title: string;
  isSelected: boolean;
}

const AddCostWorkItemsScreen: React.FC = () => {
  const { projectId, categoryId, categoryName, categoryCode, availableWorkItemIds } = useLocalSearchParams<{
    projectId: string;
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    availableWorkItemIds: string;
  }>();
  const colors = useColors();
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItems = useAllConfigRows('workItems', WorkItemDataCodeCompareAsNumber);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);
  const addWorkItemSummary = useAddRowCallback(projectId, 'workItemSummaries');

  const workItemIdsInCategory = useMemo(
    () => (availableWorkItemIds ? availableWorkItemIds.split(',') : []),
    [availableWorkItemIds],
  );

  const availableItems = useMemo(
    () =>
      allWorkItems
        .filter((w) => workItemIdsInCategory.includes(w.id))
        .map(
          (item) =>
            ({
              id: item.id,
              code: item.code,
              title: item.name,
              isSelected: selectedWorkItemIds.includes(item.id),
            } as ItemData),
        ),
    [allWorkItemSummaries, allWorkItems, selectedWorkItemIds, categoryId],
  );

  const toggleItemSelectedState = useCallback((itemId: string) => {
    setSelectedWorkItemIds((prevIds) => {
      if (prevIds.includes(itemId)) {
        return prevIds.filter((id) => id !== itemId);
      } else {
        return [...prevIds, itemId];
      }
    });
  }, []);

  const addSelectedWorkItems = useCallback(() => {
    if (selectedWorkItemIds.length < 1) return;

    for (const workItemId of selectedWorkItemIds) {
      if (!workItemId) continue;
      addWorkItemSummary({
        id: '',
        workItemId,
        bidAmount: 0,
      });
    }
    router.back();
  }, [router, selectedWorkItemIds, addWorkItemSummary]);

  const marginBottom = Platform.OS === 'android' ? 40 : 0;

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Work Items',
        }}
      />
      <View style={[styles.container, { marginBottom, paddingHorizontal: 10 }]}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={availableItems}
          renderItem={({ item }) => renderItem(item, categoryCode, toggleItemSelectedState, colors)}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No items available</Text>}
        />
        <OkayCancelButtons
          okTitle="Add Selected"
          isOkEnabled={selectedWorkItemIds.length > 0}
          onOkPress={addSelectedWorkItems}
        />
      </View>
    </SafeAreaView>
  );
};

const renderItem = (
  item: ItemData,
  sectionCode: string,
  toggleItemSelectedState: (itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isSelected = item.isSelected;
  return (
    <Pressable
      style={[styles.item, { borderColor: colors.border }]}
      onPress={() => toggleItemSelectedState(item.id)}
    >
      <View
        style={[
          styles.roundButton,
          {
            borderColor: colors.iconColor,
            borderWidth: 1,
            backgroundColor: isSelected ? colors.iconColor : 'transparent',
          },
        ]}
      />
      <View style={{ marginLeft: 50 }}>
        <Text style={styles.itemText}>
          {sectionCode}.{item.code} - {item.title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 5,
    borderTopWidth: 1,
    height: 45,
  },
  item: {
    height: 45,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
  },
  roundButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 10,
  },

  categoryInfo: {
    flex: 1,
  },
});

export default AddCostWorkItemsScreen;
