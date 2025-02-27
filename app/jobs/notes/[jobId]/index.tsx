import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useJobDb } from '@/context/DatabaseContext';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TodoData } from 'jobdb';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';

const JobNotes = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [notes, setNotes] = useState<TodoData[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingNote, setEditingNote] = useState<TodoData | null>(null);
  const { jobDbHost } = useJobDb();
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await jobDbHost?.GetTodoDB().FetchJobTodos(jobId);
      if (!response) return;

      if (response.status === 'Success') {
        setNotes(response.todos);
      }
    } catch (err) {
      setError('An error occurred while fetching the notes');
    }
  }, [jobId]);

  useEffect(() => {
    // Fetch notes when the component mounts
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(async () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note.');
      return;
    }

    const newTodo: TodoData = { Todo: newNoteTitle, JobId: jobId, Completed: false };
    try {
      const response = await jobDbHost?.GetTodoDB().CreateTodo(newTodo);
      if (!response) return;

      if (response.status === 'Success') {
        await fetchNotes();
        setNewNoteTitle(''); // Clear input after successful creation
      } else {
        alert('Failed to create note.');
      }
    } catch (err) {
      alert('An error occurred while creating the todo.');
    }
  }, [newNoteTitle, jobDbHost, jobId]);

  const deleteNote = useCallback(
    (id: string) => {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const status = await jobDbHost?.GetTodoDB().DeleteTodo(id);
              if (status === 'Success') {
                await fetchNotes();
              } else {
                alert('Failed to delete note.');
              }
            } catch (err) {
              alert('An error occurred while deleting the note.');
            }
          },
        },
      ]);
    },
    [jobDbHost, fetchNotes],
  );

  const toggleCompleted = useCallback(
    async (id: string, completed: boolean) => {
      const matchingNote = notes.find((note) => note._id === id);
      if (!matchingNote) return;

      console.log('Toggling completed', id, completed);
      const noteToUpdate = { ...matchingNote };
      noteToUpdate.Completed = !completed;

      try {
        const status = await jobDbHost?.GetTodoDB().UpdateTodo(noteToUpdate);
        if (status === 'Success') {
          await fetchNotes();
        } else {
          alert('Failed to update note.');
        }
      } catch (err) {
        alert('An error occurred while deleting the note.');
      }
    },
    [jobDbHost, fetchNotes, notes],
  );

  const editNote = useCallback((note: TodoData) => {
    setEditingNote(note);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingNote || !editingNote.Todo || !editingNote.Todo.trim()) {
      Alert.alert('Error', 'Please enter note text.');
      return;
    }

    try {
      const status = await jobDbHost?.GetTodoDB().UpdateTodo(editingNote);
      if (status === 'Success') {
        fetchNotes(); // Refresh after editing
        setEditingNote(null); // Clear editing state
      } else {
        alert('Failed to update note.');
      }
    } catch (err) {
      alert('An error occurred while deleting the note.');
    }
  }, [jobDbHost, fetchNotes, editingNote]);

  const cancelEdit = useCallback(() => {
    setEditingNote(null); // Cancel editing
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
              <ActionButton onPress={addNote} type={'action'} title="Add Note" />
            </View>
          )}

          {/* Editing Note Section */}
          {editingNote && (
            <View>
              <TextInput
                value={editingNote.Todo ?? ''}
                onChangeText={(title) => setEditingNote({ ...editingNote, Todo: title })}
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
            keyExtractor={(item) => item._id ?? ''}
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
                    textDecorationLine: item.Completed ? 'line-through' : 'none',
                  }}
                >
                  {item.Todo}
                </Text>
                <View style={{ flexDirection: 'row', marginLeft: 10, alignSelf: 'center' }}>
                  <TouchableOpacity onPress={() => toggleCompleted(item._id!, item.Completed!)}>
                    <FontAwesomeIcon
                      name={item.Completed ? 'undo' : 'check-circle'}
                      size={28}
                      color={item.Completed ? 'gray' : 'green'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteNote(item._id!)}>
                    <FontAwesomeIcon name="trash" size={28} color="red" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => editNote(item)}>
                    <FontAwesomeIcon name="edit" size={28} color="blue" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </View>
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
    maxWidth: 400,
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
