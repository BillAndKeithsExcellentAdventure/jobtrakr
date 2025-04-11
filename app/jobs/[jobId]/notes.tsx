import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import {
  NoteData,
  useAddNote,
  useAllNotes,
  useDeleteNote,
  useUpdateNote,
} from '@/tbStores/projectDetails/notes';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const JobNotes = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const { addActiveProjectIds } = useActiveProjectIds();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);

  useEffect(() => {
    if (jobId) {
      addActiveProjectIds([jobId]);
    }
  }, [jobId]);

  const notes = useAllNotes(jobId);
  const addNewNote = useAddNote(jobId);
  const removeNote = useDeleteNote(jobId);
  const updateNote = useUpdateNote(jobId);

  const addNote = useCallback(async () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note.');
      return;
    }

    const newNote: Omit<NoteData, 'id'> = { task: newNoteTitle, completed: false };
    addNewNote(newNote);
    setNewNoteTitle('');
  }, [addNewNote, newNoteTitle]);

  const deleteNote = useCallback(
    (id: string) => {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            removeNote(id);
          },
        },
      ]);
    },
    [removeNote],
  );

  const toggleCompleted = useCallback(
    (id: string, completed: boolean) => {
      const matchingNote = notes.find((note) => note.id === id);
      if (!matchingNote) return;

      console.log('Toggling completed', id, completed);
      const noteToUpdate = { ...matchingNote };
      noteToUpdate.completed = !completed;
      updateNote(noteToUpdate);
    },
    [updateNote, notes],
  );

  const saveEdit = useCallback(async () => {
    if (!editingNote || !editingNote.task || !editingNote.task.trim()) {
      Alert.alert('Error', 'Please enter note text.');
      return;
    }

    updateNote(editingNote);
    setEditingNote(null);
  }, [updateNote, editingNote]);

  const cancelEdit = useCallback(() => {
    setEditingNote(null); // Cancel editing
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.centeredView}>
          {/* Show Add Note Section only if no note is being edited */}
          {!editingNote && (
            <View>
              <TextInput
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
                placeholder="Enter job note"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
              />
              <ActionButton onPress={addNote} type={newNoteTitle ? 'action' : 'disabled'} title="Add Note" />
            </View>
          )}

          {/* Editing Note Section */}
          {editingNote && (
            <View>
              <TextInput
                value={editingNote.task ?? ''}
                onChangeText={(title) => setEditingNote({ ...editingNote, task: title })}
                placeholder="Edit note title"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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

          <FlatList
            style={{ marginTop: 20 }}
            data={notes}
            keyExtractor={(item) => item.id ?? ''}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  marginVertical: 5,
                  borderBottomWidth: 1,
                  borderBottomColor: 'gray',
                  paddingBottom: 5,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    textOverflow: 'ellipsis',
                    alignSelf: 'center',
                    justifyContent: 'center',
                    marginBottom: 5,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  }}
                >
                  {item.task}
                </Text>
                <View style={{ flexDirection: 'row', marginLeft: 10, alignSelf: 'center' }}>
                  <TouchableOpacity onPress={() => toggleCompleted(item.id!, item.completed!)}>
                    <FontAwesomeIcon
                      name={item.completed ? 'undo' : 'check-circle'}
                      size={28}
                      color={item.completed ? 'gray' : 'green'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteNote(item.id!)}>
                    <FontAwesomeIcon name="trash" size={28} color="red" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setEditingNote({ ...item })}>
                    <FontAwesomeIcon name="edit" size={28} color="blue" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default JobNotes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    padding: 10,
    width: '100%',
  },
  centeredView: {
    width: '100%',
    paddingHorizontal: 10,
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
