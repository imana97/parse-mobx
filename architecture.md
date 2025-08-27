# Parse-MobX Library Architecture

## Overview

Parse-MobX is a TypeScript library that bridges Parse Platform objects with MobX observability, enabling reactive state management for Parse-based applications. It provides a seamless integration between Parse JS SDK and MobX, making Parse objects observable and reactive.

## Core Purpose

The library solves the challenge of making Parse objects reactive in MobX-based applications by:
- Wrapping Parse objects to make their attributes observable
- Providing automatic reactivity when Parse object properties change
- Maintaining synchronization between Parse objects and their observable counterparts
- Offering collection-level state management with MobxStore

## Architecture Components

### 1. ParseMobx Class

The core wrapper class that transforms Parse objects into MobX observable objects.

```plantuml
@startuml ParseMobx
class ParseMobx {
  +loading: boolean
  -attributes: Parse.Attributes
  -parseObj: Parse.Object
  -id: string
  
  +constructor(obj: Parse.Object)
  +static toParseMobx(param: any): ParseMobx | ParseMobx[]
  +get(key: string): any
  +set(key: string, value: any): this
  +save(): Promise<this>
  +destroy(): Promise<Parse.Object>
  +getId(): string
  +getParseObject(): Parse.Object
}

class Parse.Object {
  +attributes: Parse.Attributes
  +id: string
  +save(): Promise<Parse.Object>
  +destroy(): Promise<Parse.Object>
}

ParseMobx *-- Parse.Object : wraps
@enduml
```

#### Key Features:
- **Observable Attributes**: All Parse object attributes become MobX observables
- **Loading State**: Built-in observable loading indicator during save operations  
- **Nested Object Support**: Automatically converts nested Parse objects to ParseMobx instances
- **Array Handling**: Maps arrays of Parse objects to arrays of ParseMobx objects
- **Relation Filtering**: Excludes Parse relations and ACLs from observable conversion

#### Constructor Logic:
1. Validates that Parse object is already saved (not new)
2. Creates observable attributes object
3. Iterates through Parse object attributes:
   - Converts nested Parse objects to ParseMobx instances
   - Maps arrays containing Parse objects
   - Filters out relations and ACLs
4. Makes attributes observable using `extendObservable`

### 2. MobxStore Class

A collection-level store for managing arrays of ParseMobx objects with built-in CRUD operations.

```plantuml
@startuml MobxStore
class MobxStore {
  +objects: ParseMobx[]
  +loading: boolean
  +parseError?: Parse.Error
  +subscriptionOpen: boolean
  -parseClassName: string
  -subscription?: Parse.LiveQuerySubscription
  
  +constructor(parseClassName: string)
  +fetchObjects(parseQuery?: Parse.Query): void
  +createObject(params: Attributes, options?: CreateObjectOptions): void
  +deleteObject(obj: ParseMobx, options?: DeleteObjectOptions): void
  +subscribe(parseQuery?: Parse.Query): void
  +unsubscribe(): void
  +onCreate(callback: EventCallback): void
  +onUpdate(callback: EventCallback): void
  +onEnter(callback: EventCallback): void
  +onLeave(callback: EventCallback): void
  +onDelete(callback: EventCallback): void
}

MobxStore *-- ParseMobx : manages collection
MobxStore -- Parse.LiveQuerySubscription : uses
@enduml
```

#### Key Features:
- **Observable Collection**: Maintains an observable array of ParseMobx objects
- **CRUD Operations**: Built-in create, read, update, delete functionality
- **Loading State**: Observable loading indicators for operations
- **Error Handling**: Observable error state for Parse operations
- **LiveQuery Support**: Real-time subscriptions with event callbacks
- **Asynchronous Operations**: All Parse operations wrapped in async/await patterns

### 3. Data Flow Architecture

```plantuml
@startuml DataFlow
actor User
participant "React Component" as RC
participant "MobxStore" as MS
participant "ParseMobx" as PM
participant "Parse.Object" as PO
participant "Parse Server" as PS

User -> RC : User Action
RC -> MS : fetchObjects()
MS -> PS : Query.find()
PS --> MS : Parse.Object[]
MS -> PM : new ParseMobx(obj)
PM -> PO : wrap Parse.Object
PM --> MS : ParseMobx[]
MS --> RC : Observable objects
RC --> User : UI Update (automatic)

note right of RC : MobX reactions automatically\ntrigger re-renders when\nobservable data changes
@enduml
```

### 4. Observable Attribute Management

The library handles different types of Parse attributes intelligently:

```plantuml
@startuml AttributeTypes
class "Parse Object Attributes" as POA {
  +primitives: string, number, boolean
  +dates: Date
  +nested_objects: Parse.Object
  +arrays: any[]
  +relations: Parse.Relation
  +acl: Parse.ACL
}

class "Observable Attributes" as OA {
  +primitives: observable
  +dates: observable  
  +nested_objects: ParseMobx
  +arrays: observable array
  +relations: excluded
  +acl: excluded
}

POA --> OA : conversion process
note bottom : Relations and ACLs are excluded\nfrom observable conversion
@enduml
```

### 5. LiveQuery Integration

Real-time synchronization through Parse LiveQuery:

```plantuml
@startuml LiveQuery
participant "MobxStore" as MS
participant "Parse.LiveQuerySubscription" as LQ
participant "Parse Server" as PS

MS -> LQ : subscribe(query)
LQ -> PS : WebSocket connection
PS --> LQ : Real-time events
LQ -> MS : onCreate/onUpdate/onDelete
MS -> MS : Update observable objects
note right of MS : Callbacks can be customized\nfor each event type
@enduml
```

## Type System

### Core Types
- `EventCallback`: Function signature for LiveQuery event handlers
- `Attributes`: Generic key-value object for Parse attributes  
- `CreateObjectOptions`: Configuration for object creation
- `DeleteObjectOptions`: Configuration for object deletion

## Usage Patterns

### Basic Usage
```typescript
// Convert Parse object to observable
const parseObj = await new Parse.Query('Todo').first();
const observableTodo = new ParseMobx(parseObj);

// Use in MobX store
class TodoStore {
  @observable todos: ParseMobx[] = [];
  
  @action
  async fetchTodos() {
    const objects = await new Parse.Query('Todo').find();
    this.todos = objects.map(obj => new ParseMobx(obj));
  }
}
```

### Collection Management
```typescript
// Using MobxStore for collection management
const todoStore = new MobxStore('Todo');
todoStore.fetchObjects(); // Loads and makes observable
todoStore.createObject({ title: 'New Todo', completed: false });
```

## Benefits

1. **Reactive UI**: Automatic UI updates when Parse data changes
2. **Type Safety**: Full TypeScript support with proper typing
3. **Developer Experience**: Familiar MobX patterns for Parse operations
4. **Performance**: Efficient observable updates without manual state management
5. **Real-time**: Built-in LiveQuery support for real-time applications
6. **Error Handling**: Comprehensive error state management

## Dependencies

- **MobX**: State management and observability
- **Parse**: Parse Platform JavaScript SDK
- **TypeScript**: Type safety and development experience

## Limitations

- Only works with saved Parse objects (not new/unsaved objects)
- Parse Relations and ACLs are not made observable
- Requires Parse Server setup and configuration
