const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/todos - すべてのTODOを取得
app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET /api/todos/:id - 特定のTODOを取得
app.get('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(row);
  });
});

// POST /api/todos - 新しいTODOを作成
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required' });
    return;
  }

  db.run(
    'INSERT INTO todos (text, completed) VALUES (?, ?)',
    [text, false],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

// PUT /api/todos/:id - TODOを更新
app.put('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  const { text, completed } = req.body;
  
  let updateFields = [];
  let values = [];
  
  if (text !== undefined) {
    updateFields.push('text = ?');
    values.push(text);
  }
  
  if (completed !== undefined) {
    updateFields.push('completed = ?');
    values.push(completed);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const sql = `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.run(sql, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

// DELETE /api/todos/:id - 特定のTODOを削除
app.delete('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    res.json({ message: 'Todo deleted successfully' });
  });
});

// DELETE /api/todos/completed - 完了済みのTODOをまとめて削除
app.delete('/api/todos/completed/all', (req, res) => {
  db.run('DELETE FROM todos WHERE completed = 1', [], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      message: `${this.changes} completed todos deleted successfully`,
      deletedCount: this.changes
    });
  });
});

// ルートにアクセスした場合、index.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;