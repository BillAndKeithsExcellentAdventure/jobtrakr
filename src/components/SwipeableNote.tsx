import { Feather } from '@expo/vector-icons';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useRef } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  NoteData,
  useDeleteRowCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 100;
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
      <Pressable onPress={onToggleComplete} style={{ width: 50, alignItems: 'center' }}>
        <FontAwesomeIcon name={'check-circle'} size={28} color={isCompleted ? 'red' : 'green'} />
      </Pressable>

      <Pressable onPress={onDelete} style={{ width: 50, alignItems: 'center' }}>
        <FontAwesomeIcon name="trash" size={28} color="red" />
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
    }, [removeNote, note.id]);

    const toggleCompleted = useCallback(() => {
      const noteToUpdate = { ...note };
      noteToUpdate.completed = !note.completed;
      updateNote(note.id, noteToUpdate);
      swipeableRef.current?.close();
    }, [updateNote, note]);

    const onEdit = useCallback(() => {
      setNoteToEdit(note.id);
      swipeableRef.current?.close();
    }, [setNoteToEdit, note.id]);

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
          <Pressable onPress={onEdit}>
            <View style={styles.itemInfo}>
              <Text
                style={{
                  flex: 1,
                  textOverflow: 'ellipsis',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  marginBottom: 5,
                  textDecorationLine: note.completed ? 'line-through' : 'none',
                  color: note.completed ? colors.error : colors.text,
                }}
              >
                {note.task}
              </Text>
              <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                <Feather name="chevrons-right" size={24} color={colors.iconColor} />
              </View>
            </View>
          </Pressable>
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

});

export default SwipeableNote;
