class TodoApp {
    constructor() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        
        this.bindEvents();
        this.loadTodos();
    }
    
    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }
    
    async loadTodos() {
        try {
            this.showLoading();
            const response = await fetch('/api/todos');
            if (!response.ok) {
                throw new Error('Failed to load todos');
            }
            const todos = await response.json();
            this.renderTodos(todos);
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('タスクの読み込みに失敗しました');
        }
    }
    
    async addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;
        
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add todo');
            }
            
            this.todoInput.value = '';
            this.loadTodos();
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showError('タスクの追加に失敗しました');
        }
    }
    
    async toggleTodo(id, completed) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update todo');
            }
            
            this.loadTodos();
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showError('タスクの更新に失敗しました');
        }
    }
    
    async deleteTodo(id) {
        if (!confirm('このタスクを削除しますか？')) return;
        
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete todo');
            }
            
            this.loadTodos();
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('タスクの削除に失敗しました');
        }
    }
    
    async clearCompleted() {
        if (!confirm('完了済みのタスクをすべて削除しますか？')) return;
        
        try {
            const response = await fetch('/api/todos/completed/all', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear completed todos');
            }
            
            this.loadTodos();
        } catch (error) {
            console.error('Error clearing completed todos:', error);
            this.showError('完了済みタスクの削除に失敗しました');
        }
    }
    
    renderTodos(todos) {
        if (todos.length === 0) {
            this.todoList.innerHTML = '<div class="empty-state">タスクがありません</div>';
            return;
        }
        
        const todoItems = todos.map(todo => {
            const completedClass = todo.completed ? 'completed' : '';
            const checkedAttr = todo.completed ? 'checked' : '';
            
            return `
                <li class="todo-item ${completedClass}" data-id="${todo.id}">
                    <input type="checkbox" class="todo-checkbox" ${checkedAttr} 
                           onchange="app.toggleTodo(${todo.id}, this.checked)">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">削除</button>
                </li>
            `;
        }).join('');
        
        this.todoList.innerHTML = todoItems;
    }
    
    showLoading() {
        this.todoList.innerHTML = '<div class="loading">読み込み中...</div>';
    }
    
    showError(message) {
        this.todoList.innerHTML = `<div class="error">${message}</div>`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new TodoApp();