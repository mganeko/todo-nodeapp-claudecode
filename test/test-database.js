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

module.exports = {
  initializeTestDatabase,
  getTestDatabase,
  closeTestDatabase
};