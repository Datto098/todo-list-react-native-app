import * as SQLite from "expo-sqlite";

class Database {
  constructor() {
    // Trong trường hợp này, bạn không cần constructor, vì không có logic cụ thể nào cần được thực thi khi khởi tạo lớp Database.
  }

  // Định nghĩa phương thức openDatabase để mở kết nối với cơ sở dữ liệu
  openDatabase() {
    return SQLite.openDatabase("db.db");
  }

  async createTodoTable() {
    const db = this.openDatabase();
    await db.transactionAsync(async (tx) => {
      await tx.executeSqlAsync(
        "CREATE TABLE IF NOT EXISTS todo (" +
          "id INTEGER PRIMARY KEY AUTOINCREMENT," +
          "name TEXT," +
          "time TEXT," +
          "completed INTEGER DEFAULT 0" +
          ");"
      );
    });
  }

  async addTodo(todoName, todoTime) {
    const db = this.openDatabase();
    await db.transactionAsync(async (tx) => {
      const result = await tx.executeSqlAsync(
        "INSERT INTO todo (name, time, completed) VALUES (?, ?, ?)",
        [todoName, todoTime, 0]
      );
      if (result.rowsAffected !== 1) {
        console.error("Failed to insert todo.");
      }
    });
  }

  async getTodos() {
    const db = this.openDatabase();
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM todo",
          [],
          (_, { rows }) => {
            const todos = rows._array;
            resolve(todos);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  }

  clearDatabase = async () => {
    await db.transactionAsync(async (tx) => {
      await tx.executeSqlAsync("DROP TABLE IF EXISTS todo");
      await tx.executeSqlAsync(
        "CREATE TABLE IF NOT EXISTS todo (" +
          "id INTEGER PRIMARY KEY AUTOINCREMENT," +
          "name TEXT," +
          "time TEXT," +
          "completed BOOLEAN DEFAULT false" +
          ");"
      );
    });
  };

  async deleteTodo(todoId) {
    const db = this.openDatabase();
    await db.transactionAsync(async (tx) => {
      const result = await tx.executeSqlAsync("DELETE FROM todo WHERE id = ?", [
        todoId,
      ]);
      if (result.rowsAffected !== 1) {
        console.error("Failed to delete todo.");
      }
    });
  }
}

export default Database;
