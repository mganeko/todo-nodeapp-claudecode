const express = require('express');
const path = require('path');
const TodoService = require('./todo-service');

function createApp(database) {
  const db = database || require('./database');
  const todoService = new TodoService(db);
  const app = express();
  
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // GET /api/todos - すべてのTODOを取得
  app.get('/api/todos', async (req, res) => {
    try {
      const todos = await todoService.getAllTodos();
      res.json(todos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/todos/:id - 特定のTODOを取得
  app.get('/api/todos/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const todo = await todoService.getTodoById(id);
      if (!todo) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json(todo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todos - 新しいTODOを作成
  app.post('/api/todos', async (req, res) => {
    try {
      const { text } = req.body;
      const todoId = await todoService.createTodo(text);
      const newTodo = await todoService.getTodoById(todoId);
      res.status(201).json(newTodo);
    } catch (err) {
      if (err.message === 'Text is required') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // PUT /api/todos/:id - TODOを更新
  app.put('/api/todos/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { text, completed } = req.body;
      
      const changes = await todoService.updateTodo(id, { text, completed });
      if (changes === 0) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      
      const updatedTodo = await todoService.getTodoById(id);
      res.json(updatedTodo);
    } catch (err) {
      if (err.message === 'No fields to update' || err.message === 'Text cannot be empty') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // DELETE /api/todos/:id - 特定のTODOを削除
  app.delete('/api/todos/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const changes = await todoService.deleteTodo(id);
      
      if (changes === 0) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      
      res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/todos/completed - 完了済みのTODOをまとめて削除
  app.delete('/api/todos/completed/all', async (req, res) => {
    try {
      const deletedCount = await todoService.deleteCompletedTodos();
      res.json({ 
        message: `${deletedCount} completed todos deleted successfully`,
        deletedCount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ルートにアクセスした場合、index.htmlを返す
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

// 本番環境での起動
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { createApp };