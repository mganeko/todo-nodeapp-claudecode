class TodoService {
  constructor(database) {
    this.db = database;
  }

  // 全てのTodoを取得
  getAllTodos() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM todos ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 特定のTodoを取得
  getTodoById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 新しいTodoを作成
  createTodo(text) {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        reject(new Error('Text is required'));
        return;
      }

      this.db.run(
        'INSERT INTO todos (text, completed) VALUES (?, ?)',
        [text.trim(), false],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // 作成されたTodoを取得して返す
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Todoを更新
  updateTodo(id, updates) {
    return new Promise((resolve, reject) => {
      const { text, completed } = updates;
      
      let updateFields = [];
      let values = [];
      
      if (text !== undefined) {
        if (text.trim() === '') {
          reject(new Error('Text cannot be empty'));
          return;
        }
        updateFields.push('text = ?');
        values.push(text.trim());
      }
      
      if (completed !== undefined) {
        updateFields.push('completed = ?');
        values.push(completed ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const sql = `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`;
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Todoを削除
  deleteTodo(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // 完了済みTodoを一括削除
  deleteCompletedTodos() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM todos WHERE completed = 1', [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

module.exports = TodoService;