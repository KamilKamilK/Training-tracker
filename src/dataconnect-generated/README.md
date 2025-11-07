# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListExercises*](#listexercises)
  - [*ListMyWorkoutRoutines*](#listmyworkoutroutines)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*UpdateWorkoutSessionNotes*](#updateworkoutsessionnotes)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListExercises
You can execute the `ListExercises` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listExercises(): QueryPromise<ListExercisesData, undefined>;

interface ListExercisesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListExercisesData, undefined>;
}
export const listExercisesRef: ListExercisesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listExercises(dc: DataConnect): QueryPromise<ListExercisesData, undefined>;

interface ListExercisesRef {
  ...
  (dc: DataConnect): QueryRef<ListExercisesData, undefined>;
}
export const listExercisesRef: ListExercisesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listExercisesRef:
```typescript
const name = listExercisesRef.operationName;
console.log(name);
```

### Variables
The `ListExercises` query has no variables.
### Return Type
Recall that executing the `ListExercises` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListExercisesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListExercisesData {
  exercises: ({
    id: UUIDString;
    name: string;
    exerciseType: string;
    targetMuscles?: string[] | null;
  } & Exercise_Key)[];
}
```
### Using `ListExercises`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listExercises } from '@dataconnect/generated';


// Call the `listExercises()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listExercises();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listExercises(dataConnect);

console.log(data.exercises);

// Or, you can use the `Promise` API.
listExercises().then((response) => {
  const data = response.data;
  console.log(data.exercises);
});
```

### Using `ListExercises`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listExercisesRef } from '@dataconnect/generated';


// Call the `listExercisesRef()` function to get a reference to the query.
const ref = listExercisesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listExercisesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.exercises);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.exercises);
});
```

## ListMyWorkoutRoutines
You can execute the `ListMyWorkoutRoutines` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyWorkoutRoutines(): QueryPromise<ListMyWorkoutRoutinesData, undefined>;

interface ListMyWorkoutRoutinesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyWorkoutRoutinesData, undefined>;
}
export const listMyWorkoutRoutinesRef: ListMyWorkoutRoutinesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyWorkoutRoutines(dc: DataConnect): QueryPromise<ListMyWorkoutRoutinesData, undefined>;

interface ListMyWorkoutRoutinesRef {
  ...
  (dc: DataConnect): QueryRef<ListMyWorkoutRoutinesData, undefined>;
}
export const listMyWorkoutRoutinesRef: ListMyWorkoutRoutinesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyWorkoutRoutinesRef:
```typescript
const name = listMyWorkoutRoutinesRef.operationName;
console.log(name);
```

### Variables
The `ListMyWorkoutRoutines` query has no variables.
### Return Type
Recall that executing the `ListMyWorkoutRoutines` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyWorkoutRoutinesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyWorkoutRoutinesData {
  workoutRoutines: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & WorkoutRoutine_Key)[];
}
```
### Using `ListMyWorkoutRoutines`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyWorkoutRoutines } from '@dataconnect/generated';


// Call the `listMyWorkoutRoutines()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyWorkoutRoutines();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyWorkoutRoutines(dataConnect);

console.log(data.workoutRoutines);

// Or, you can use the `Promise` API.
listMyWorkoutRoutines().then((response) => {
  const data = response.data;
  console.log(data.workoutRoutines);
});
```

### Using `ListMyWorkoutRoutines`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyWorkoutRoutinesRef } from '@dataconnect/generated';


// Call the `listMyWorkoutRoutinesRef()` function to get a reference to the query.
const ref = listMyWorkoutRoutinesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyWorkoutRoutinesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.workoutRoutines);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.workoutRoutines);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateWorkoutSessionNotes
You can execute the `UpdateWorkoutSessionNotes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateWorkoutSessionNotes(vars: UpdateWorkoutSessionNotesVariables): MutationPromise<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;

interface UpdateWorkoutSessionNotesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateWorkoutSessionNotesVariables): MutationRef<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
}
export const updateWorkoutSessionNotesRef: UpdateWorkoutSessionNotesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateWorkoutSessionNotes(dc: DataConnect, vars: UpdateWorkoutSessionNotesVariables): MutationPromise<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;

interface UpdateWorkoutSessionNotesRef {
  ...
  (dc: DataConnect, vars: UpdateWorkoutSessionNotesVariables): MutationRef<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
}
export const updateWorkoutSessionNotesRef: UpdateWorkoutSessionNotesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateWorkoutSessionNotesRef:
```typescript
const name = updateWorkoutSessionNotesRef.operationName;
console.log(name);
```

### Variables
The `UpdateWorkoutSessionNotes` mutation requires an argument of type `UpdateWorkoutSessionNotesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateWorkoutSessionNotesVariables {
  id: UUIDString;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `UpdateWorkoutSessionNotes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateWorkoutSessionNotesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateWorkoutSessionNotesData {
  workoutSession_update?: WorkoutSession_Key | null;
}
```
### Using `UpdateWorkoutSessionNotes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateWorkoutSessionNotes, UpdateWorkoutSessionNotesVariables } from '@dataconnect/generated';

// The `UpdateWorkoutSessionNotes` mutation requires an argument of type `UpdateWorkoutSessionNotesVariables`:
const updateWorkoutSessionNotesVars: UpdateWorkoutSessionNotesVariables = {
  id: ..., 
  notes: ..., // optional
};

// Call the `updateWorkoutSessionNotes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateWorkoutSessionNotes(updateWorkoutSessionNotesVars);
// Variables can be defined inline as well.
const { data } = await updateWorkoutSessionNotes({ id: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateWorkoutSessionNotes(dataConnect, updateWorkoutSessionNotesVars);

console.log(data.workoutSession_update);

// Or, you can use the `Promise` API.
updateWorkoutSessionNotes(updateWorkoutSessionNotesVars).then((response) => {
  const data = response.data;
  console.log(data.workoutSession_update);
});
```

### Using `UpdateWorkoutSessionNotes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateWorkoutSessionNotesRef, UpdateWorkoutSessionNotesVariables } from '@dataconnect/generated';

// The `UpdateWorkoutSessionNotes` mutation requires an argument of type `UpdateWorkoutSessionNotesVariables`:
const updateWorkoutSessionNotesVars: UpdateWorkoutSessionNotesVariables = {
  id: ..., 
  notes: ..., // optional
};

// Call the `updateWorkoutSessionNotesRef()` function to get a reference to the mutation.
const ref = updateWorkoutSessionNotesRef(updateWorkoutSessionNotesVars);
// Variables can be defined inline as well.
const ref = updateWorkoutSessionNotesRef({ id: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateWorkoutSessionNotesRef(dataConnect, updateWorkoutSessionNotesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.workoutSession_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.workoutSession_update);
});
```

