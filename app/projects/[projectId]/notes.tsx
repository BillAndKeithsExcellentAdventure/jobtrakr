import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import {
  NoteData,
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
  useUpdateRowCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableNote from './SwipeableNote';
import { useColors } from '@/context/ColorsContext';

const ProjectNotes = () => {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  const notes = useAllRows(projectId, 'notes');
  const addNewNote = useAddRowCallback(projectId, 'notes');
  const updateNote = useUpdateRowCallback(projectId, 'notes');
  const colors = useColors();

  const addNote = useCallback(async () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note.');
      return;
    }

    const newNote: NoteData = { id: '', task: newNoteTitle, completed: false };
    addNewNote(newNote);
    setNewNoteTitle('');
  }, [addNewNote, newNoteTitle]);

  const saveEdit = useCallback(async () => {
    if (!editingNote || !editingNote.task || !editingNote.task.trim()) {
      Alert.alert('Error', 'Please enter note text.');
      return;
    }

    updateNote(editingNote.id, editingNote);
    setEditingNote(null);
  }, [updateNote, editingNote]);

  const cancelEdit = useCallback(() => {
    setEditingNote(null); // Cancel editing
  }, []);

  const handleSetNoteToEdit = useCallback(
    (id: string) => {
      const matchingNote = notes.find((note) => note.id === id);
      if (!matchingNote) return;

      setEditingNote({ ...matchingNote });
    },
    [notes],
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${projectName}`, headerShown: true }} />
      <View style={styles.container}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View style={styles.centeredView}>
              <View style={[styles.inputAreaView, { backgroundColor: colors.listBackground }]}>
                {/* Show Add Note Section only if no note is being edited */}
                {!editingNote && (
                  <View style={{ backgroundColor: colors.listBackground }}>
                    <TextInput
                      value={newNoteTitle}
                      onChangeText={setNewNoteTitle}
                      placeholder="Enter note"
                      multiline
                      numberOfLines={3}
                      style={{
                        borderWidth: 1,
                        padding: 8,
                        marginBottom: 10,
                        minHeight: 40,
                        maxHeight: 100,
                        textAlignVertical: 'top',
                        backgroundColor: colors.background,
                      }}
                    />
                    <ActionButton
                      onPress={addNote}
                      type={newNoteTitle ? 'action' : 'disabled'}
                      title="Add Note"
                    />
                  </View>
                )}

                {/* Editing Note Section */}
                {editingNote && (
                  <View style={{ backgroundColor: colors.listBackground }}>
                    <TextInput
                      value={editingNote.task ?? ''}
                      onChangeText={(title) => setEditingNote({ ...editingNote, task: title })}
                      placeholder="Edit note title"
                      multiline
                      numberOfLines={3}
                      style={{
                        borderWidth: 1,
                        padding: 8,
                        marginBottom: 10,
                        minHeight: 40,
                        maxHeight: 100,
                        textAlignVertical: 'top',
                        backgroundColor: colors.background,
                      }}
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: colors.listBackground,
                      }}
                    >
                      <ActionButton style={styles.saveButton} onPress={saveEdit} type={'ok'} title="Save" />
                      <ActionButton
                        style={styles.cancelButton}
                        onPress={cancelEdit}
                        type={'cancel'}
                        title="Cancel"
                      />
                    </View>
                  </View>
                )}
              </View>
              <FlatList
                style={{ marginTop: 10, borderColor: colors.border, borderTopWidth: 1 }}
                data={notes}
                keyExtractor={(item) => item.id ?? ''}
                renderItem={({ item }) => (
                  <View style={{ borderColor: colors.border, borderBottomWidth: 1 }}>
                    <SwipeableNote projectId={projectId} note={item} setNoteToEdit={handleSetNoteToEdit} />
                  </View>
                )}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProjectNotes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
  },

  inputAreaView: {
    padding: 10,
    borderRadius: 8,
  },

  centeredView: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginRight: 5,
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});
