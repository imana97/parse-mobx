import React from 'react';
import todoStore from './store/todo-store';
import { observer } from 'mobx-react';
import { ParseMobx } from '../../lib';


const App: React.FC = observer(() =>
  <>
    {todoStore.todos.map((todo: ParseMobx) => (
      <div key={todo.getId()}>{todo.get('todo')}</div>
    ))}
  </>,
);

export default App;
