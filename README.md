<p align="center">
 
 <h2 align="center">package: parse-mobx</h2>
 <p align="center">Simple and efficient wrapper for Parse Objects to make it compatible with Mobx.</p>
  <p align="center">
    <a href="https://github.com/imana97/parse-mobx/ts-npm-package-boilerplate/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/imana97/parse-mobx?style=flat&color=336791" />
    </a>
    <a href="https://github.com/imana97/parse-mobx/pulls">
      <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/imana97/parse-mobx?style=flat&color=336791" />
    </a>
     <a href="https://github.com/imana97/parse-mobx">
      <img alt="GitHub Downloads" src="https://img.shields.io/npm/dw/parse-mobx?style=flat&color=336791" />
    </a>
    <a href="https://github.com/imana97/parse-mobx/">
      <img alt="GitHub Total Downloads" src="https://img.shields.io/npm/dt/parse-mobx?color=336791&label=Total%20downloads" />
    </a>
 <a href="https://github.com/imana97/parse-mobx/">
      <img alt="GitHub release" src="https://img.shields.io/github/release/imana97/parse-mobx.svg?style=flat&color=336791" />
    </a>
    <br />
    <br />
  <a href="https://github.com/imana97/parse-mobx/issues/new/choose">Report Bug</a>
  <a href="https://github.com/imana97/parse-mobx/issues/new/choose">Request Feature</a>
  </p>
 
<p align="center">Did you like the project? Please, considerate <a href="https://www.buymeacoffee.com/imana97">a donation</a> to help improve!</p>


# Getting Started

## 📚 API Documentation 

https://imana97.github.io/parse-mobx/

## 📦 Installation

Parse-MobX requires **MobX** and **Parse SDK** as peer dependencies:

```bash
# Install parse-mobx and its peer dependencies
npm install parse-mobx mobx parse

# For TypeScript projects, also install types
npm install -D @types/parse
```

### Requirements
- **MobX**: `^6.13.0`
- **Parse SDK**: `^6.1.1`
- **Node.js**: `^18.0.0` or higher
- **TypeScript**: `^5.0.0` (if using TypeScript)

## 🚀 Quick Start

### 1. Parse Server Setup

First, initialize Parse in your application:

```typescript
import Parse from 'parse';

// Initialize Parse
Parse.initialize(
  'YOUR_APP_ID',
  'YOUR_JAVASCRIPT_KEY'
);
Parse.serverURL = 'https://your-parse-server.com/parse';
```

### 2. Basic Usage

```typescript
import { ParseMobx } from 'parse-mobx';
import { observable, action } from 'mobx';

// Create a Parse object and make it observable
const parseObject = await new Parse.Query('Todo').first();
const observableTodo = new ParseMobx(parseObject);

// Now you can use it reactively in your components
console.log(observableTodo.get('title')); // Gets the title
observableTodo.set('completed', true).save(); // Updates and saves
```

## 📝 Complete Todo App Example

Here's a comprehensive React Todo application using **parse-mobx**, **MobX**, and **React**:

### Store Setup (`stores/TodoStore.ts`)

```typescript
import { makeObservable, observable, action, runInAction } from 'mobx';
import Parse from 'parse';
import { ParseMobx, MobxStore } from 'parse-mobx';

export class TodoStore extends MobxStore {
  @observable newTodoText = '';
  @observable filter: 'all' | 'active' | 'completed' = 'all';

  constructor() {
    super('Todo'); // Pass Parse class name
    makeObservable(this);
  }

  @action
  setNewTodoText(text: string) {
    this.newTodoText = text;
  }

  @action
  setFilter(filter: 'all' | 'active' | 'completed') {
    this.filter = filter;
  }

  @action
  async addTodo() {
    if (!this.newTodoText.trim()) return;
    
    await this.createObject({
      title: this.newTodoText.trim(),
      completed: false,
      createdAt: new Date()
    }, { updateList: true });
    
    this.newTodoText = '';
  }

  @action
  async toggleTodo(todo: ParseMobx) {
    const completed = !todo.get('completed');
    await todo.set('completed', completed).save();
  }

  @action
  async deleteTodo(todo: ParseMobx) {
    await this.deleteObject(todo);
  }

  @action
  async loadTodos() {
    const query = new Parse.Query('Todo');
    query.ascending('createdAt');
    this.fetchObjects(query);
  }

  get filteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.objects.filter(todo => !todo.get('completed'));
      case 'completed':
        return this.objects.filter(todo => todo.get('completed'));
      default:
        return this.objects;
    }
  }

  get activeTodosCount() {
    return this.objects.filter(todo => !todo.get('completed')).length;
  }
}

// Create a singleton instance
export const todoStore = new TodoStore();
```

### React Components

#### Main Todo App (`components/TodoApp.tsx`)

```typescript
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { todoStore } from '../stores/TodoStore';
import { TodoInput } from './TodoInput';
import { TodoList } from './TodoList';
import { TodoFilters } from './TodoFilters';
import './TodoApp.css';

export const TodoApp = observer(() => {
  useEffect(() => {
    todoStore.loadTodos();
  }, []);

  if (todoStore.loading) {
    return (
      <div className="todo-app">
        <div className="loading">Loading todos...</div>
      </div>
    );
  }

  return (
    <div className="todo-app">
      <header className="header">
        <h1>todos</h1>
        <TodoInput />
      </header>
      
      <main className="main">
        <TodoList />
      </main>
      
      <footer className="footer">
        <TodoFilters />
        <span className="todo-count">
          {todoStore.activeTodosCount} items left
        </span>
      </footer>
      
      {todoStore.parseError && (
        <div className="error">
          Error: {todoStore.parseError.message}
          <button onClick={() => todoStore.clearError()}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
});
```

#### Todo Input (`components/TodoInput.tsx`)

```typescript
import React from 'react';
import { observer } from 'mobx-react-lite';
import { todoStore } from '../stores/TodoStore';

export const TodoInput = observer(() => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    todoStore.addTodo();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      todoStore.addTodo();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        value={todoStore.newTodoText}
        onChange={(e) => todoStore.setNewTodoText(e.target.value)}
        onKeyPress={handleKeyPress}
        autoFocus
      />
    </form>
  );
});
```

#### Todo List (`components/TodoList.tsx`)

```typescript
import React from 'react';
import { observer } from 'mobx-react-lite';
import { todoStore } from '../stores/TodoStore';
import { TodoItem } from './TodoItem';

export const TodoList = observer(() => {
  if (todoStore.filteredTodos.length === 0) {
    return (
      <div className="no-todos">
        {todoStore.filter === 'completed' 
          ? 'No completed todos' 
          : 'No todos yet. Add one above!'}
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todoStore.filteredTodos.map((todo) => (
        <TodoItem key={todo.getId()} todo={todo} />
      ))}
    </ul>
  );
});
```

#### Individual Todo Item (`components/TodoItem.tsx`)

```typescript
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ParseMobx } from 'parse-mobx';
import { todoStore } from '../stores/TodoStore';

interface TodoItemProps {
  todo: ParseMobx;
}

export const TodoItem = observer(({ todo }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.get('title'));

  const handleSave = async () => {
    if (editText.trim()) {
      await todo.set('title', editText.trim()).save();
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(todo.get('title'));
      setIsEditing(false);
    }
  };

  const isCompleted = todo.get('completed');
  const title = todo.get('title');

  return (
    <li className={`todo-item ${isCompleted ? 'completed' : ''}`}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={isCompleted}
          onChange={() => todoStore.toggleTodo(todo)}
        />
        
        {isEditing ? (
          <input
            className="edit"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        ) : (
          <label onDoubleClick={() => setIsEditing(true)}>
            {title}
          </label>
        )}
        
        <button
          className="destroy"
          onClick={() => todoStore.deleteTodo(todo)}
        >
          ×
        </button>
      </div>
      
      {todo.loading && <div className="todo-loading">Saving...</div>}
    </li>
  );
});
```

#### Filter Controls (`components/TodoFilters.tsx`)

```typescript
import React from 'react';
import { observer } from 'mobx-react-lite';
import { todoStore } from '../stores/TodoStore';

export const TodoFilters = observer(() => {
  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'completed' as const, label: 'Completed' },
  ];

  return (
    <div className="filters">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          className={todoStore.filter === key ? 'selected' : ''}
          onClick={() => todoStore.setFilter(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
});
```

## 🔄 Real-time Updates with LiveQuery

Enable real-time synchronization across clients:

```typescript
export class TodoStore extends MobxStore {
  constructor() {
    super('Todo');
    makeObservable(this);
    
    // Subscribe to real-time updates
    this.subscribe();
    
    // Setup event handlers
    this.onCreate((todo) => {
      console.log('New todo created:', todo.get('title'));
    });
    
    this.onUpdate((todo) => {
      console.log('Todo updated:', todo.get('title'));
    });
    
    this.onDelete((todo) => {
      console.log('Todo deleted');
    });
  }
}
```

## 🎨 CSS Styling (`TodoApp.css`)

```css
.todo-app {
  max-width: 550px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header h1 {
  font-size: 3rem;
  color: #b83f45;
  text-align: center;
  margin-bottom: 20px;
}

.new-todo {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.todo-item.completed label {
  text-decoration: line-through;
  color: #999;
}

.toggle {
  margin-right: 15px;
}

.destroy {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #cc9a9a;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.filters button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.filters button.selected {
  background: #b83f45;
  color: white;
}

.loading, .no-todos {
  text-align: center;
  padding: 20px;
  color: #999;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
```

## 🛠 Advanced Features

### Custom Parse Object Classes

```typescript
// Define a custom Parse object
class Todo extends Parse.Object {
  constructor() {
    super('Todo');
  }
  
  static spawn(attrs: any) {
    const todo = new Todo();
    return todo.set(attrs);
  }
}

// Register the subclass
Parse.Object.registerSubclass('Todo', Todo);

// Use with ParseMobx
const todo = Todo.spawn({ title: 'Learn Parse-MobX' });
await todo.save();
const observableTodo = new ParseMobx(todo);
```

### Optimistic Updates

```typescript
@action
async toggleTodoOptimistic(todo: ParseMobx) {
  // Update UI immediately
  const oldValue = todo.get('completed');
  todo.set('completed', !oldValue);
  
  try {
    // Save to server
    await todo.save();
  } catch (error) {
    // Revert on error
    todo.set('completed', oldValue);
    console.error('Failed to update todo:', error);
  }
}
```

This example demonstrates the full power of parse-mobx with reactive UI updates, real-time synchronization, and clean separation of concerns using MobX stores!




