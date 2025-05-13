import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import {
  ProjectTemplateData,
  useDeleteRowCallback,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const RightAction = React.memo(
  ({
    onDelete,
    prog,
    drag,
  }: {
    onDelete: () => void;
    prog: SharedValue<number>;
    drag: SharedValue<number>;
  }) => {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: drag.value + 100 }],
      };
    });

    return (
      <Pressable onPress={onDelete}>
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  },
);

const SwipeableProjectTemplate = ({ projectTemplate }: { projectTemplate: ProjectTemplateData }) => {
  const router = useRouter();
  const removeProjectTemplate = useDeleteRowCallback('templates');
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

  const renderRightActions = useCallback(
    (prog: SharedValue<number>, drag: SharedValue<number>) => {
      return <RightAction onDelete={() => handleDelete(projectTemplate.id)} prog={prog} drag={drag} />;
    },
    [handleDelete, projectTemplate.id],
  );

  return (
    <ReanimatedSwipeable
      key={projectTemplate.id}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enableContextMenu
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/projects/configuration/template/[templateId]',
              params: { templateId: projectTemplate.id },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <View style={{ flex: 1 }}>
              <Text txtSize="title" text={projectTemplate.name} />
              <Text style={styles.itemName}>{projectTemplate.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
          </View>
        </Pressable>
      </View>
    </ReanimatedSwipeable>
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
    width: 100,
    height: 70,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableProjectTemplate;
