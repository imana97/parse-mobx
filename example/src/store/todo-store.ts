import { makeObservable, observable, action, runInAction } from 'mobx';
import Parse from 'parse';
import { ParseMobx } from '../../../lib'; // parse mobx


class TodoStore {
  constructor() {
    makeObservable(this);
  }

  @observable text: string = '';
  @observable status: boolean = false;
  @observable todos: ParseMobx[] = [];
  @observable loading: boolean = false;
  @observable error: string = '';

  @action
  async newItem(value: string): Promise<void> {

    this.loading = true;
    try {
      const newItem: Parse.Object<Parse.Attributes> = new Parse.Object('Todo');
      newItem.set('todo', value);
      newItem.set('status', false);
      await newItem.save();
      runInAction((): void => {
        this.text = '';
        this.todos?.push(new ParseMobx(newItem));
      });
    } catch (error) {
      runInAction((): void => {
        this.status = false;
      });
    } finally {
      runInAction((): void => {
        this.loading = false;
      });
    }

  }
}

const todoStore: TodoStore = new TodoStore();

export default todoStore;