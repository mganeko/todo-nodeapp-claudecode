const request = require('supertest');
const { createApp } = require('./server');
const { initializeTestDatabase, getTestDatabase, closeTestDatabase } = require('./test-database');

let app;

beforeAll(async () => {
  await initializeTestDatabase();
  const testDb = getTestDatabase();
  app = createApp(testDb);
});

afterAll(async () => {
  await closeTestDatabase();
});

beforeEach((done) => {
  const db = getTestDatabase();
  db.run('DELETE FROM todos', [], (err) => {
    if (err) {
      done(err);
    } else {
      done();
    }
  });
});

describe('Todo API', () => {
  describe('GET /api/todos', () => {
    test('空のリストを返す', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    test('作成されたTodoを返す', async () => {
      const db = getTestDatabase();
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO todos (text, completed) VALUES (?, ?)',
          ['Test todo', false],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const response = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        text: 'Test todo',
        completed: 0
      });
    });
  });

  describe('GET /api/todos/:id', () => {
    test('存在するTodoを返す', async () => {
      const db = getTestDatabase();
      
      const todoId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO todos (text, completed) VALUES (?, ?)',
          ['Test todo', false],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      const response = await request(app)
        .get(`/api/todos/${todoId}`)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: todoId,
        text: 'Test todo',
        completed: 0
      });
    });

    test('存在しないTodoで404を返す', async () => {
      const response = await request(app)
        .get('/api/todos/999')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'Todo not found'
      });
    });
  });

  describe('POST /api/todos', () => {
    test('新しいTodoを作成', async () => {
      const newTodo = { text: 'New test todo' };
      
      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);
      
      expect(response.body).toMatchObject({
        text: 'New test todo',
        completed: 0
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
    });

    test('テキストなしで400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'Text is required'
      });
    });

    test('空文字列で400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'Text is required'
      });
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const db = getTestDatabase();
      
      todoId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO todos (text, completed) VALUES (?, ?)',
          ['Test todo', false],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    });

    test('Todoのテキストを更新', async () => {
      const updatedData = { text: 'Updated todo text' };
      
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: todoId,
        text: 'Updated todo text',
        completed: 0
      });
    });

    test('Todoの完了状態を更新', async () => {
      const updatedData = { completed: true };
      
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: todoId,
        text: 'Test todo',
        completed: 1
      });
    });

    test('テキストと完了状態を同時に更新', async () => {
      const updatedData = { text: 'Updated text', completed: true };
      
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: todoId,
        text: 'Updated text',
        completed: 1
      });
    });

    test('存在しないTodoで404を返す', async () => {
      const response = await request(app)
        .put('/api/todos/999')
        .send({ text: 'Updated text' })
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'Todo not found'
      });
    });

    test('更新フィールドなしで400エラーを返す', async () => {
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({})
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'No fields to update'
      });
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const db = getTestDatabase();
      
      todoId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO todos (text, completed) VALUES (?, ?)',
          ['Test todo', false],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    });

    test('Todoを削除', async () => {
      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(200);
      
      expect(response.body).toMatchObject({
        message: 'Todo deleted successfully'
      });

      // 削除されたことを確認
      await request(app)
        .get(`/api/todos/${todoId}`)
        .expect(404);
    });

    test('存在しないTodoで404を返す', async () => {
      const response = await request(app)
        .delete('/api/todos/999')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'Todo not found'
      });
    });
  });

  describe('DELETE /api/todos/completed/all', () => {
    beforeEach(async () => {
      const db = getTestDatabase();
      
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('INSERT INTO todos (text, completed) VALUES (?, ?)', ['Todo 1', false]);
          db.run('INSERT INTO todos (text, completed) VALUES (?, ?)', ['Todo 2', true]);
          db.run('INSERT INTO todos (text, completed) VALUES (?, ?)', ['Todo 3', true], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });

    test('完了済みTodoを全て削除', async () => {
      const response = await request(app)
        .delete('/api/todos/completed/all')
        .expect(200);
      
      expect(response.body).toMatchObject({
        message: '2 completed todos deleted successfully',
        deletedCount: 2
      });

      // 未完了のTodoが残っていることを確認
      const remainingResponse = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(remainingResponse.body).toHaveLength(1);
      expect(remainingResponse.body[0]).toMatchObject({
        text: 'Todo 1',
        completed: 0
      });
    });

    test('完了済みTodoがない場合', async () => {
      // 全て未完了にする
      const db = getTestDatabase();
      await new Promise((resolve, reject) => {
        db.run('UPDATE todos SET completed = 0', [], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });

      const response = await request(app)
        .delete('/api/todos/completed/all')
        .expect(200);
      
      expect(response.body).toMatchObject({
        message: '0 completed todos deleted successfully',
        deletedCount: 0
      });
    });
  });
});