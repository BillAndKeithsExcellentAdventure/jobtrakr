import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  ProjectTemplateData,
  useDeleteRowCallback,
  useTemplateWorkItemData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => {
  return (
    <Pressable onPress={onDelete} style={styles.rightAction}>
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );
});

const SwipeableProjectTemplate = ({ projectTemplate }: { projectTemplate: ProjectTemplateData }) => {
  const router = useRouter();
  const removeProjectTemplate = useDeleteRowCallback('templates');
  const { templateWorkItemIds, templateWorkCategoryIds } = useTemplateWorkItemData(projectTemplate.id);
  //const numberOfCostItems = templateWorkItemIds.length;

  const colors = useColors();

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Project Template',
        'Are you sure you want to delete this project template?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeProjectTemplate(itemId) }],
        { cancelable: true },
      );
    },
    [removeProjectTemplate],
  );

  const renderRightActions = useCallback(() => {
    return <RightAction onDelete={() => handleDelete(projectTemplate.id)} />;
  }, [handleDelete, projectTemplate.id]);

  return (
    <SwipeableComponent
      key={projectTemplate.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={renderRightActions}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/configuration/template/[templateId]',
              params: { templateId: projectTemplate.id },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <View style={{ flex: 1 }}>
              <Text txtSize="title" text={projectTemplate.name} />
              <Text
                style={[
                  styles.itemName,
                  { color: templateWorkItemIds.length > 0 ? colors.text : colors.error },
                ]}
              >
                {`${projectTemplate.description} (${templateWorkCategoryIds.length} work categories)`}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 70,
    paddingVertical: 5,
  },
  itemName: {
    marginRight: 10,
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: 70,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableProjectTemplate;
