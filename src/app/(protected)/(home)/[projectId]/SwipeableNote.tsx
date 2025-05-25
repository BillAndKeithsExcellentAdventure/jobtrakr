import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';

import Base64Image from '@/src/components/Base64Image';
import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  NoteData,
  ReceiptData,
  useAllRows,
  useDeleteRowCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { VideoCodec } from 'expo-camera';

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 160;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(
  ({
    isCompleted,
    onToggleComplete,
    onEdit,
    onDelete,
  }: {
    isCompleted: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onToggleComplete: () => void;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        width: RIGHT_ACTION_WIDTH,
        alignSelf: 'center',
        justifyContent: 'center',
      }}
    >
      <Pressable onPress={onToggleComplete} style={{ width: 50 }}>
        <FontAwesomeIcon
          name={isCompleted ? 'undo' : 'check-circle'}
          size={28}
          color={isCompleted ? 'gray' : 'green'}
        />
      </Pressable>

      <Pressable onPress={onDelete} style={{ width: 50 }}>
        <FontAwesomeIcon name="trash" size={28} color="red" />
      </Pressable>

      <Pressable onPress={onEdit} style={{ width: 50 }}>
        <FontAwesomeIcon name="edit" size={28} color="blue" />
      </Pressable>
    </View>
  ),
);

const SwipeableNote = React.memo(
  ({
    projectId,
    note,
    setNoteToEdit,
  }: {
    projectId: string;
    note: NoteData;
    setNoteToEdit: (id: string) => void;
  }) => {
    const removeNote = useDeleteRowCallback(projectId, 'notes');
    const updateNote = useUpdateRowCallback(projectId, 'notes');
    const colors = useColors();

    const swipeableRef = useRef<SwipeableHandles>(null);

    const deleteNote = useCallback(() => {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            removeNote(note.id);
            swipeableRef.current?.close();
          },
        },
      ]);
    }, [removeNote]);

    const toggleCompleted = useCallback(() => {
      const noteToUpdate = { ...note };
      noteToUpdate.completed = !note.completed;
      updateNote(note.id, noteToUpdate);
      swipeableRef.current?.close();
    }, [updateNote, note]);

    const onEdit = useCallback(() => {
      setNoteToEdit(note.id);
      swipeableRef.current?.close();
    }, [updateNote, note]);

    const renderRightActions = useCallback(
      () => (
        <RightAction
          isCompleted={note.completed}
          onDelete={deleteNote}
          onEdit={onEdit}
          onToggleComplete={toggleCompleted}
        />
      ),
      [note.completed, deleteNote, onEdit, toggleCompleted],
    );

    return (
      <SwipeableComponent
        ref={swipeableRef}
        key={note.id}
        threshold={SWIPE_THRESHOLD_WIDTH}
        actionWidth={RIGHT_ACTION_WIDTH}
        renderRightActions={renderRightActions}
      >
        <View style={[styles.itemEntry]}>
          <View style={styles.itemInfo}>
            <Text
              style={{
                flex: 1,
                textOverflow: 'ellipsis',
                alignSelf: 'center',
                justifyContent: 'center',
                marginBottom: 5,
                textDecorationLine: note.completed ? 'line-through' : 'none',
              }}
            >
              {note.task}
            </Text>
            <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </View>
      </SwipeableComponent>
    );
  },
);

const styles = StyleSheet.create({
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 40,
    paddingVertical: 5,
  },
  itemEntry: {
    width: '100%',
    paddingLeft: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    minHeight: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableNote;
