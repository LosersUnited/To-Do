import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { scheduleNotificationAsync } from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const CrossPlatformDateTimePickerAIO = (props) => {
  const [date, setDate] = useState(undefined);
  const [time, setTime] = useState(undefined);

  const handleDateChange = (event, selectedDate) => {
    if (date !== undefined)
      return;
    const currentDate = selectedDate || date;
    setDate(currentDate);
    // if (Platform.OS === 'ios') {
    //   props.onChange(currentDate);
    // } else
    // {
    const combinedDateTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      time.getHours(),
      time.getMinutes()
    );
    props.onChange(event, combinedDateTime);
    // }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (time !== undefined)
      return;
    const currentTime = selectedTime || time;
    setTime(currentTime);
    // if (Platform.OS === 'ios') {
    //   props.onChange(currentTime);
    // }
  };

  const showDateTimePicker = (
    <DateTimePicker
      {...props}
      mode="datetime"
    />
  );

  const showDatePicker = (
    <DateTimePicker
      {...props}
      onChange={handleDateChange}
      mode="date"
    />
  );

  const showTimePicker = (
    <DateTimePicker
      {...props}
      onChange={handleTimeChange}
      mode="time"
    />
  );

  return Platform.OS === 'ios' ? showDateTimePicker : <View>{time === undefined ? showTimePicker : showDatePicker}</View>;
};

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

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
    if (event?.type === 'dismissed') {
      setShow(false);
      setDate(date);
      return;
    }
    const currentDate = selectedDate || date;
    setShow(false);
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
        {!DateTimePicker.toString().includes("DateTimePicker is not supported on:") && Platform.OS === "android" ? <TouchableOpacity style={styles.addButton} onPress={() => setShow(true)}>
          <Text style={styles.buttonText}>{date.toString()}</Text>
        </TouchableOpacity> : undefined}
        {!DateTimePicker.toString().includes("DateTimePicker is not supported on:") ?
          (show || Platform.OS === "ios" ? <CrossPlatformDateTimePickerAIO
            testID="dateTimePicker"
            value={date}
            mode="datetime"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            onError={console.error}
            onDim
            themeVariant="dark"
            style={{ color: '#fff' }} // this doesn't work :((
          // ill figure it out
          /> : undefined)
          : <input type="datetime-local" value={date.toISOString().slice(0, 16)} onChange={(ev) => onDateChange(ev, new Date(ev.target.valueAsNumber))}></input>}
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new to-do" // this doesn't work anyway.
          value={newTodo}
          onChangeText={(text) => setNewTodo(text)}
        />
      </View>
      <ScrollView style={styles.scrollView}>
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
      </ScrollView>
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
    marginTop: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: 30,
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
});
