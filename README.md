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
  <a href="https://github.com/hebertcisco/ts-npm-package-boilerplate/issues/new/choose">Report Bug</a>
  <a href="https://github.com/hebertcisco/ts-npm-package-boilerplate/issues/new/choose">Request Feature</a>
  </p>
 
<p align="center">Did you like the project? Please, considerate <a href="https://www.buymeacoffee.com/imana97">a donation</a> to help improve!</p>


# Getting started

## Installation

```shell
npm install parse-mobx --save
```

    
## How to use

#### React & React-Native Example
Here is a simple Todo application using mobx, mobx-react and parse-mobx.
Please note that you can use parse-mobx in non react js frameworks such as
Angular.

###### todo-store.js

```javascript

import {observable, action, runInAction, configure} from 'mobx';
import Parse from 'parse/react-native';
import {ParseMobx} from "parse-mobx";
    
configure({enforceActions: "observed"});
    
const Todo = Parse.Object.extend('todo');
    
export class TodoStore {
    
    
    @observable todos = [];
    @observable loading = false;
    @observable newText = "";
    
    @action
    updateText(val) {
        this.newText = val;
    }
    
    
    @action
    async fetchTodos() {
        this.loading = true;
        const todos = await new Parse.Query('todo').find();
        runInAction(() => {
            this.todos = ParseMobx.toParseMobx(todos);
            this.loading = false;
        });
    }
    
    @action
    async addTodo(title = 'unknown') {
        this.loading = true;
        const newTodo = await new Todo().set('title', title).save();
        runInAction(() => {
            this.todos.push(ParseMobx.toParseMobx(newTodo));
            this.loading = false;
        });
    }
    
    @action
    updateTodo(todo, newVal) {
        todo.set('completed', newVal).save();
    }
        
    @action
    async removeTodo(todo) {
        this.loading = true;
        await todo.destroy();
        runInAction(()=>{
            ParseMobx.deleteListItem(this.todos, todo);
            this.loading = false;
        });
    }
}

```

    
    
###### TodoApp.js
we pass a new instance of our store as props to TodoApp.
```jsx
import React, {Component} from "react";
import {
    Container,
    Content,
    ListItem,
    Text,
    Body,
    Right,
    List,
    Form,
    Item,
    Label,
    Input,
    } from 'native-base';
    
    import {observer} from "mobx-react";
    import {Switch} from 'react-native';
    
    @observer
    export default class Todo extends Component {
        
    componentWillMount() {
        this.props.store.fetchTodos();
    }
        
    render() {
        return (
            <Container>
                <Content>
    
                        {/* Add new todo */}
                    <Form>
                        <Item floatingLabel>
                            <Label>New Todo</Label>
                            <Input value={this.props.store.newText}
                                    onChange={(e) => this.props.store.updateText(e.target.value)}/>
                        </Item>
                    </Form>
    
                        {/* todo List */}
                    <List>
                        {this.props.store.todos.map((todo) => (
                            <ListItem key={todo.id}>
                                <Body>
                                <Text>{todo.get('title')}</Text>
                                </Body>
                                <Right>
                                <Switch value={todo.get('completed')}
                                            onValueChange={(value) => todo.set('completed', value).save()}/>
                                </Right>
                            </ListItem>
                        ))}
                    </List>
                </Content>
            </Container>
        )
    }
}
```




