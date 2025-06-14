const TodoService = require('../todo-service');
const { 
  initializeTestDatabase, 
  getTestDatabase, 
  closeTestDatabase,
  clearAllTodos,
  createTestTodo,
  createMultipleTodos,
  markAllTodosAsUncompleted
} = require('./test-database');

let todoService;

beforeAll(async () => {
  await initializeTestDatabase();
  const testDb = getTestDatabase();
  todoService = new TodoService(testDb);
});

afterAll(async () => {
  await closeTestDatabase();
});

beforeEach(async () => {
  await clearAllTodos();
});

describe('TodoService', () => {
  describe('getAllTodos', () => {
    test('空のリストを返す', async () => {
      const todos = await todoService.getAllTodos();
      expect(todos).toEqual([]);
    });

    test('作成されたTodoを返す', async () => {
      await createTestTodo('Test todo', false);

      const todos = await todoService.getAllTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0]).toMatchObject({
        text: 'Test todo',
        completed: 0
      });
    });
  });

  describe('getTodoById', () => {
    test('存在するTodoを返す', async () => {
      const todoId = await createTestTodo('Test todo', false);

      const todo = await todoService.getTodoById(todoId);
      expect(todo).toMatchObject({
        id: todoId,
        text: 'Test todo',
        completed: 0
      });
    });

    test('存在しないTodoでundefinedを返す', async () => {
      const todo = await todoService.getTodoById(999);
      expect(todo).toBeUndefined();
    });
  });

  describe('createTodo', () => {
    test('新しいTodoを作成してIDを返す', async () => {
      const todoId = await todoService.createTodo('New test todo');
      expect(todoId).toBeDefined();
      expect(typeof todoId).toBe('number');

      const createdTodo = await todoService.getTodoById(todoId);
      expect(createdTodo).toMatchObject({
        id: todoId,
        text: 'New test todo',
        completed: 0
      });
    });

    test('空文字列でエラーを投げる', async () => {
      await expect(todoService.createTodo('')).rejects.toThrow('Text is required');
    });

    test('undefinedでエラーを投げる', async () => {
      await expect(todoService.createTodo()).rejects.toThrow('Text is required');
    });

    test('空白文字のみでエラーを投げる', async () => {
      await expect(todoService.createTodo('   ')).rejects.toThrow('Text is required');
    });

    test('前後の空白をトリムして保存', async () => {
      const todoId = await todoService.createTodo('  Trimmed text  ');
      const todo = await todoService.getTodoById(todoId);
      expect(todo.text).toBe('Trimmed text');
    });
  });

  describe('updateTodo', () => {
    let todoId;

    beforeEach(async () => {
      todoId = await createTestTodo('Test todo', false);
    });

    test('テキストを更新', async () => {
      const changes = await todoService.updateTodo(todoId, { text: 'Updated text' });
      expect(changes).toBe(1);

      const updatedTodo = await todoService.getTodoById(todoId);
      expect(updatedTodo.text).toBe('Updated text');
    });

    test('完了状態を更新', async () => {
      const changes = await todoService.updateTodo(todoId, { completed: true });
      expect(changes).toBe(1);

      const updatedTodo = await todoService.getTodoById(todoId);
      expect(updatedTodo.completed).toBe(1);
    });

    test('テキストと完了状態を同時に更新', async () => {
      const changes = await todoService.updateTodo(todoId, { 
        text: 'Updated text', 
        completed: true 
      });
      expect(changes).toBe(1);

      const updatedTodo = await todoService.getTodoById(todoId);
      expect(updatedTodo.text).toBe('Updated text');
      expect(updatedTodo.completed).toBe(1);
    });

    test('存在しないTodoで0を返す', async () => {
      const changes = await todoService.updateTodo(999, { text: 'Updated text' });
      expect(changes).toBe(0);
    });

    test('更新フィールドなしでエラーを投げる', async () => {
      await expect(todoService.updateTodo(todoId, {})).rejects.toThrow('No fields to update');
    });

    test('空文字列でエラーを投げる', async () => {
      await expect(todoService.updateTodo(todoId, { text: '' })).rejects.toThrow('Text cannot be empty');
    });

    test('空白文字のみでエラーを投げる', async () => {
      await expect(todoService.updateTodo(todoId, { text: '   ' })).rejects.toThrow('Text cannot be empty');
    });

    test('テキスト更新時に前後の空白をトリム', async () => {
      await todoService.updateTodo(todoId, { text: '  Trimmed updated text  ' });
      const updatedTodo = await todoService.getTodoById(todoId);
      expect(updatedTodo.text).toBe('Trimmed updated text');
    });

    test('completed falseで正常に更新', async () => {
      // まず完了状態にする
      await todoService.updateTodo(todoId, { completed: true });
      
      // falseに戻す
      const changes = await todoService.updateTodo(todoId, { completed: false });
      expect(changes).toBe(1);

      const updatedTodo = await todoService.getTodoById(todoId);
      expect(updatedTodo.completed).toBe(0);
    });
  });

  describe('deleteTodo', () => {
    let todoId;

    beforeEach(async () => {
      todoId = await createTestTodo('Test todo', false);
    });

    test('Todoを削除', async () => {
      const changes = await todoService.deleteTodo(todoId);
      expect(changes).toBe(1);

      const deletedTodo = await todoService.getTodoById(todoId);
      expect(deletedTodo).toBeUndefined();
    });

    test('存在しないTodoで0を返す', async () => {
      const changes = await todoService.deleteTodo(999);
      expect(changes).toBe(0);
    });
  });

  describe('deleteCompletedTodos', () => {
    beforeEach(async () => {
      await createMultipleTodos([
        { text: 'Todo 1', completed: false },
        { text: 'Todo 2', completed: true },
        { text: 'Todo 3', completed: true }
      ]);
    });

    test('完了済みTodoを全て削除', async () => {
      const deletedCount = await todoService.deleteCompletedTodos();
      expect(deletedCount).toBe(2);

      const remainingTodos = await todoService.getAllTodos();
      expect(remainingTodos).toHaveLength(1);
      expect(remainingTodos[0]).toMatchObject({
        text: 'Todo 1',
        completed: 0
      });
    });

    test('完了済みTodoがない場合は0を返す', async () => {
      // 全て未完了にする
      await markAllTodosAsUncompleted();

      const deletedCount = await todoService.deleteCompletedTodos();
      expect(deletedCount).toBe(0);

      const remainingTodos = await todoService.getAllTodos();
      expect(remainingTodos).toHaveLength(3);
    });
  });
});