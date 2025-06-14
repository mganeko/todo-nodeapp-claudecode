const sqlite3 = require('sqlite3').verbose();

let db;

function initializeTestDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('Error opening test database:', err.message);
        reject(err);
      } else {
        console.log('Connected to in-memory SQLite database for testing');
        createTestTables(resolve, reject);
      }
    });
  });
}

function createTestTables(resolve, reject) {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating test table:', err.message);
      reject(err);
    } else {
      console.log('Test todos table ready');
      resolve();
    }
  });
}

function getTestDatabase() {
  return db;
}

function closeTestDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Test database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// テストデータ操作用のヘルパー関数

// 全てのTodoを削除
function clearAllTodos() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM todos', [], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 単一のTodoを作成
function createTestTodo(text, completed = false) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO todos (text, completed) VALUES (?, ?)',
      [text, completed ? 1 : 0],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// 複数のTodoを作成（バッチ作成）
function createMultipleTodos(todos) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare('INSERT INTO todos (text, completed) VALUES (?, ?)');
      
      todos.forEach(todo => {
        stmt.run([todo.text, todo.completed ? 1 : 0]);
      });
      
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// 全てのTodoをcompletedに設定
function markAllTodosAsCompleted() {
  return new Promise((resolve, reject) => {
    db.run('UPDATE todos SET completed = 1', [], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 全てのTodoをuncompletedに設定
function markAllTodosAsUncompleted() {
  return new Promise((resolve, reject) => {
    db.run('UPDATE todos SET completed = 0', [], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  initializeTestDatabase,
  getTestDatabase,
  closeTestDatabase,
  clearAllTodos,
  createTestTodo,
  createMultipleTodos,
  markAllTodosAsCompleted,
  markAllTodosAsUncompleted
};