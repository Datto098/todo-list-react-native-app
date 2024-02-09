import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import AppLoading from "expo-app-loading";
import CheckBox from "react-native-check-box";
import { useCallback, useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import Entypo from "@expo/vector-icons/Entypo";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import Database from "./database";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
  });

  const [appIsReady, setAppIsReady] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [todoName, setTodoName] = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [todoCompleted, setTodoCompleted] = useState(0);
  const db = new Database();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setSelectedTime(currentDate);
  };

  const showMode = (currentMode) => {
    DateTimePickerAndroid.open({
      value: selectedTime,
      onChange,
      mode: currentMode,
      is24Hour: true,
    });
  };

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  useEffect(() => {
    db.createTodoTable().then(() => {
      db.getTodos()
        .then((todos) => {
          setTodos(todos);
        })
        .catch((error) => {
          console.error("Lỗi khi lấy danh sách todo:", error);
        });
    });
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      let count = 0;
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].completed === 1) {
          count++;
        }
      }
      setTodoCompleted(count);
    } else {
      setTodoCompleted(0);
    }
  }, [todos]);

  const showTimepicker = () => {
    showMode("time");
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const handleAddTodo = () => {
    let checked = true;
    if (todoName === "") {
      checked = false;
      alert("Please enter a todo name !!!");
    }

    if (!selectedTime) {
      checked = false;
      alert("Please choose time !!!");
    }

    if (checked) {
      const database = new Database();
      database
        .addTodo(todoName, selectedTime.toString())
        .then(() => {
          db.getTodos()
            .then((todos) => {
              setTodos(todos);
            })
            .catch((error) => {
              console.error("Lỗi khi lấy danh sách todo:", error);
            });
        })
        .catch((error) => {
          console.error("Lỗi khi lấy danh sách todo:", error);
        });
      setTodoName("");
      setSelectedTime(new Date());
    }

    return checked;
  };

  if (!appIsReady || !fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {/* Button add new todo */}
      <View style={styles.action_bar}>
        <Entypo name="list" size={20} style={styles.fa_icon} />
        <Entypo name="moon" size={20} style={styles.fa_icon} />
      </View>
      <View style={styles.view_title}>
        <Text style={styles.rg_text}>Hey Dev Your's</Text>
        <Text style={styles.sp_text}>To-do's</Text>
        <Text style={styles.rg_text}>
          {todoCompleted}/{todos.length} Completed
        </Text>
      </View>
      <ScrollView style={styles.view_todo}>
        {todos.length > 0 &&
          todos.map((todo, index) => {
            return (
              <View style={[styles.todo_item]} key={index}>
                <CheckBox
                  style={styles.checkbox}
                  isChecked={todo.completed === 1}
                  onClick={() => {
                    setTodos((prevTodos) => {
                      const updatedTodos = [...prevTodos];
                      updatedTodos[index].completed =
                        updatedTodos[index].completed === 1 ? 0 : 1;
                      return updatedTodos;
                    });
                  }}
                />
                <View style={[styles.todo_detail, { flex: 1 }]}>
                  <Text
                    style={[
                      styles.rg_text,
                      todo.completed && styles.todo_completed,
                    ]}
                  >
                    {todo.name}
                  </Text>
                  <Text>{todo.time.toString()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    db.deleteTodo(todo.id)
                      .then(() => {
                        db.getTodos()
                          .then((todos) => {
                            setTodos(todos);
                          })
                          .catch((error) => {
                            console.error("Lỗi khi lấy danh sách todo:", error);
                          });
                      })
                      .catch((err) => console.log(err));
                  }}
                >
                  <Entypo name="trash" size={20} style={styles.fa_icon} />
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>
      <Animated.View
        style={[
          styles.form_add_todo,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TextInput
          placeholder="Enter todo name"
          style={styles.text_field}
          value={todoName}
          onChange={(e) => {
            setTodoName(e.nativeEvent.text);
          }}
        />
        <TextInput
          placeholder="Time selected"
          style={styles.text_field}
          value={formatDate(selectedTime)}
          editable={false}
        />
        <View style={styles.border}>
          {/* Time picker */}
          <TouchableOpacity onPress={showTimepicker} style={styles.flex_center}>
            <Text style={{ color: "#747474", fontSize: 16 }}>Select time </Text>
            <Entypo name="clock" size={20} style={styles.fa_icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.border}>
          <TouchableOpacity onPress={showDatepicker} style={styles.flex_center}>
            <Text style={{ color: "#747474", fontSize: 16 }}>Select date</Text>
            <Entypo name="calendar" size={20} style={styles.fa_icon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.btn_add}
          onPress={() => {
            const resultAdd = handleAddTodo();
            if (resultAdd) {
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.ease,
                useNativeDriver: true,
              }).start();
            }
          }}
        >
          <Text style={{ color: "#fff" }}>ADD</Text>
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity
        style={styles.view_btn_add}
        onPress={() => {
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Entypo name="plus" size={20} style={styles.icon_white} />
        <Text style={{ color: "#fff" }}>ADD</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  form_add_todo: {
    borderTopWidth: 1,
    borderColor: "#747474",
    zIndex: 10,
    position: "absolute",
    backgroundColor: "#fff",
    top: "auto",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "start",
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 10,
  },
  border: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#747474",
    borderRadius: 8,
    height: 50,
  },
  text_field: {
    width: "100%",
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#747474",
    fontSize: 16,
  },
  action_bar: {
    gap: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    flexDirection: "row",
  },
  fa_icon: {
    color: "#747474",
    width: 25,
    height: 25,
  },
  view_title: {
    paddingTop: 40,
  },
  rg_text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
  },
  sp_text: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#202675",
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  todo_item: {
    display: "flex",
    flexDirection: "row",
    gap: 30,
    justifyContent: "start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  todo_detail: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "start",
  },
  btn_add: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#202675",
    borderRadius: 1000,
    width: 120,
    marginRight: 0,
    marginLeft: "auto",
  },
  view_btn_add: {
    position: "absolute",
    right: 20,
    bottom: 20,
    display: "flex",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#202675",
    borderRadius: 1000,
    width: 120,
  },
  icon_white: {
    color: "#fff",
  },
  flex_center: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  todo_completed: {
    textDecorationLine: "line-through",
  },
});
