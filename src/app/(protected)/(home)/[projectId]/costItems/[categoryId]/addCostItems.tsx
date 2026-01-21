import { ModalScreenContainerWithList } from '@/src/components/ModalScreenContainerWithList';
import { Text, View } from '@/src/components/Themed';
import { Colors } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows as useAllConfigRows,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

interface ItemData {
  id: string;
  code: string;
  title: string;
  isSelected: boolean;
}

const AddCostWorkItemsScreen: React.FC = () => {
  const { projectId, categoryCode, availableWorkItemIds } = useLocalSearchParams<{
    projectId: string;
    categoryCode: string;
    availableWorkItemIds: string;
  }>();
  const colors = useColors();
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
    [allWorkItems, selectedWorkItemIds, workItemIdsInCategory],
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
        complete: false,
      });
    }
    router.back();
  }, [selectedWorkItemIds, addWorkItemSummary]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainerWithList
        onSave={addSelectedWorkItems}
        onCancel={() => router.back()}
        canSave={selectedWorkItemIds.length > 0}
        saveButtonTitle="Add Selected"
      >
        <Text style={styles.modalTitle}>Add Cost Items</Text>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={availableItems}
          renderItem={({ item }) => renderItem(item, categoryCode, toggleItemSelectedState, colors)}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No items available</Text>}
        />
      </ModalScreenContainerWithList>
    </View>
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
    <View style={styles.item}>
      <Pressable style={[{ borderColor: colors.border }]} onPress={() => toggleItemSelectedState(item.id)}>
        <View
          style={[
            styles.roundButton,
            {
              borderColor: colors.iconColor,
              borderWidth: 1,
              backgroundColor: isSelected ? colors.iconColor : 'transparent',
              marginRight: 50,
            },
          ]}
        />
      </Pressable>
      <View>
        <Text style={styles.itemText}>
          {sectionCode}.{item.code} - {item.title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
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
});

export default AddCostWorkItemsScreen;
