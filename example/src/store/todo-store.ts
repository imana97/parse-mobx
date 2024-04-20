import { makeObservable, observable, action, runInAction } from 'mobx';
import Parse from 'parse';
import { ParseMobx } from '../../../lib';


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
  async getTodos() {
    this.loading = true;
    try {
      const query = new Parse.Query('Todo');
      const results = await query.find();
      runInAction(() => {
        this.todos = results.map((item) => new ParseMobx(item));
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

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

  @action
  async deleteItem(itemId: string): Promise<void> {
    const itemToDelete = this.todos.find((item) => item.getId() === itemId);
    if (itemToDelete) {
      await itemToDelete.destroy();
      runInAction(() => {
        this.todos = this.todos.filter((item) => item !== itemToDelete);
      });
    }
  }

  @action
  async updateItem(itemId: string, updatedTodo:string): Promise<void> {
    const itemToUpdate = this.todos.find((item) => item.getId() === itemId);
    if (itemToUpdate) {
      await itemToUpdate.set('todo', updatedTodo).save();
    }
  }

}

const todoStore: TodoStore = new TodoStore();

export default todoStore;