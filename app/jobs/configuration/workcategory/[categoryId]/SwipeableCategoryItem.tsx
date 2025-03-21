import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';
import { WorkCategoryItemData } from '@/app/models/types';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

const SwipeableCategoryItem = ({ item }: { item: WorkCategoryItemData }) => {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  return (
    <View style={[styles.itemEntry, { borderColor: colors.borderColor, borderBottomWidth: 1 }]}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCode}>{item.Code}</Text>
        <Text style={styles.itemName}>{item.Name}</Text>
        <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  categoryItems: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  itemName: {
    width: 200,
    marginRight: 10,
  },
  itemEntry: {
    width: '100%',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCode: {
    flex: 1,
  },
  categoryItem: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },

  categoryInfo: {
    flex: 1,
  },
});

export default SwipeableCategoryItem;
