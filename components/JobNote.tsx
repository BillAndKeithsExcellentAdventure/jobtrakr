import { TodoData } from 'jobdb';
import React from 'react';
import { Button, StyleSheet } from 'react-native';
import { View, Text } from './Themed';

// Define your TodoData type if not imported

export type JobNoteProps = {
  todo: TodoData;
  onMarkComplete: (id: string) => void;
  onRemove: (id: string) => void;
};

export const JobNote = ({ todo, onMarkComplete, onRemove }: JobNoteProps) => (
  <View style={styles.todoItem}>
    <Text style={[styles.todoText, todo.Completed && styles.completed]}>{todo.Todo}</Text>
    <View style={styles.buttonsContainer}>
      <Button
        title={todo.Completed ? 'Undo' : 'Complete'}
        onPress={() => todo._id && onMarkComplete(todo._id)}
        disabled={!!todo.Completed}
      />
      <Button title="Remove" onPress={() => todo._id && onRemove(todo._id)} color="red" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  todoItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  todoText: {
    fontSize: 18,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
