# Parse Mobx
Simple and efficient wrapper for Parse Objects to make it compatible
with Mobx.

## Installation
    npm i parse-mobx --save
    
## How to use

#### React & React-Native Example
Here is a simple Todo application using mobx, mobx-react and parse-mobx.
Please note that you can use parse-mobx in non react js frameworks such as
Angular.

###### todo-store.js

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
    
###### TodoApp.js
we pass a new instance of our store as props to TodoApp.

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

#### Licence MIT

#### Questions?
iman@novowell.io
