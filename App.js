import React, {useEffect, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {Platform, scheduleNotificationAsync} from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    loadTodos();
  }, []);

  const saveTodos = async (updatedTodos) => {
    try {
      const todosString = JSON.stringify(updatedTodos);
      await AsyncStorage.setItem('todos', todosString);
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const loadTodos = async () => {
    try {
      const todosString = await AsyncStorage.getItem('todos');
      if (todosString) {
        const loadedTodos = JSON.parse(todosString);
        setTodos(loadedTodos);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      const updatedTodos = [
        ...todos,
        { text: newTodo, reminder: date },
      ];
      setTodos(updatedTodos);
      saveTodos(updatedTodos);
      setNewTodo('');
      scheduleNotification(newTodo, date);
    }
  };

  const removeTodo = (index) => {
    const updatedTodos = [...todos];
    updatedTodos.splice(index, 1);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  function formatDateTime(dateTimeString) {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    return new Date(dateTimeString).toLocaleTimeString(navigator.language, options);
  }
  
  function hasTimestampPassed(timestamp_str) {
    const timestamp = new Date(timestamp_str);
    const currentDate = new Date();
    return currentDate > timestamp;
  }
  
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
  };
  
  const scheduleNotification = async (todo) => {
    console.log(date.getSeconds())
    await scheduleNotificationAsync({
      content: {
        title: 'To-Do Reminder',
        body: `Don't forget about your to-do: ${todo}`,
      },
      trigger: date,
    });
  };

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do App</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new to-do"
          value={newTodo}
          onChangeText={(text) => setNewTodo(text)}
        />
      </View>
      <View style={styles.inputContainer}>
        <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="datetime"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            style={{ color: '#fff' }} // this doesn't work :((
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.todoList}>
        {todos.length === 0 ? (
            <Text style={styles.todoText}>No todos available</Text>
        ) : (
            todos.map((todo, index) => (
                <View key={index} style={styles.todoItem}>
                  <Text style={[hasTimestampPassed(todo.reminder) ? styles.passedReminderText : styles.todoText]}>
                    {todo.text} - {formatDateTime(todo.reminder)}
                  </Text>
                  <TouchableOpacity onPress={() => removeTodo(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
            ))
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  passedReminderText: {
    color: '#8F8',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  todoList: {
    width: '100%',
  },
  todoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
  },
  todoText: {
    color: '#fff',
    alignSelf: "center"
  },
  removeButton: {
    color: '#FF4500',
  },
});