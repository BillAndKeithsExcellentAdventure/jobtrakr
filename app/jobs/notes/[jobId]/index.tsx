import { useLocalSearchParams, Stack } from 'expo-router';
import { Text, View, TextInput } from '@/components/Themed';
import { useJobDb } from '@/context/DatabaseContext';

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, StyleSheet, SafeAreaView, Button } from 'react-native';
import { JobNote } from '@/components/JobNote'; // Import the updated TodoItem component
import { TodoData } from 'jobdb';

type DBStatus = 'success' | 'error' | 'loading';

const JobNotes = () => {
  const [todos, setTodos] = useState<TodoData[]>([]);
  const [status, setStatus] = useState<DBStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const { jobDbHost } = useJobDb();
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await jobDbHost?.GetTodoDB().FetchJobTodos(jobId);
        if (!response) return;

        if (response.status === 'Success') {
          setTodos(response.todos);
          setStatus('success');
        } else {
          setStatus('error');
          setError('Failed to load notes');
        }
      } catch (err) {
        setStatus('error');
        setError('An error occurred while fetching the notes');
      }
    };

    fetchTodos();
  }, [jobId, jobDbHost]);

  const handleMarkComplete = (id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo._id === id ? { ...todo, completed: !todo.Completed } : todo)),
    );
  };

  const handleRemove = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
  };

  const handleCreateTodo = useCallback(async () => {
    if (!newTodoTitle.trim()) {
      alert("Note can't be empty.");
      return;
    }

    const newTodo: TodoData = { Todo: newTodoTitle, JobId: jobId, Completed: false };

    try {
      const response = await jobDbHost?.GetTodoDB().CreateTodo(newTodo);
      if (!response) return;

      if (response.status === 'Success') {
        setTodos((prevTodos) => [...prevTodos, { ...newTodo, JobId: jobId, _id: response.id }]);
        setNewTodoTitle(''); // Clear input after successful creation
      } else {
        alert('Failed to create note.');
      }
    } catch (err) {
      alert('An error occurred while creating the todo.');
    }
  }, [newTodoTitle, jobDbHost, jobId]);

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading todos...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `Job Notes`, headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text txtSize="title" text={jobName} style={styles.headerText} />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter new note"
              value={newTodoTitle}
              onChangeText={setNewTodoTitle}
            />
            <Button title="Add" onPress={handleCreateTodo} />
          </View>
        </View>
        <FlatList
          data={todos}
          renderItem={({ item }) => (
            <JobNote todo={item} onMarkComplete={handleMarkComplete} onRemove={handleRemove} />
          )}
          keyExtractor={(item) => item._id ?? '0'} // Add a fallback value for the key
          ListEmptyComponent={<Text>No notes found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    marginBottom: 10,
  },

  errorText: {
    color: 'red',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '60%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 4,
  },
});

export default JobNotes;
