import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateUserData {
  user_insert: User_Key;
}

export interface ExerciseLog_Key {
  workoutSessionId: UUIDString;
  exerciseId: UUIDString;
  __typename?: 'ExerciseLog_Key';
}

export interface Exercise_Key {
  id: UUIDString;
  __typename?: 'Exercise_Key';
}

export interface ListExercisesData {
  exercises: ({
    id: UUIDString;
    name: string;
    exerciseType: string;
    targetMuscles?: string[] | null;
  } & Exercise_Key)[];
}

export interface ListMyWorkoutRoutinesData {
  workoutRoutines: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & WorkoutRoutine_Key)[];
}

export interface RoutineExercise_Key {
  workoutRoutineId: UUIDString;
  exerciseId: UUIDString;
  __typename?: 'RoutineExercise_Key';
}

export interface UpdateWorkoutSessionNotesData {
  workoutSession_update?: WorkoutSession_Key | null;
}

export interface UpdateWorkoutSessionNotesVariables {
  id: UUIDString;
  notes?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface WorkoutRoutine_Key {
  id: UUIDString;
  __typename?: 'WorkoutRoutine_Key';
}

export interface WorkoutSession_Key {
  id: UUIDString;
  __typename?: 'WorkoutSession_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListExercisesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListExercisesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListExercisesData, undefined>;
  operationName: string;
}
export const listExercisesRef: ListExercisesRef;

export function listExercises(): QueryPromise<ListExercisesData, undefined>;
export function listExercises(dc: DataConnect): QueryPromise<ListExercisesData, undefined>;

interface UpdateWorkoutSessionNotesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateWorkoutSessionNotesVariables): MutationRef<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateWorkoutSessionNotesVariables): MutationRef<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
  operationName: string;
}
export const updateWorkoutSessionNotesRef: UpdateWorkoutSessionNotesRef;

export function updateWorkoutSessionNotes(vars: UpdateWorkoutSessionNotesVariables): MutationPromise<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
export function updateWorkoutSessionNotes(dc: DataConnect, vars: UpdateWorkoutSessionNotesVariables): MutationPromise<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;

interface ListMyWorkoutRoutinesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyWorkoutRoutinesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyWorkoutRoutinesData, undefined>;
  operationName: string;
}
export const listMyWorkoutRoutinesRef: ListMyWorkoutRoutinesRef;

export function listMyWorkoutRoutines(): QueryPromise<ListMyWorkoutRoutinesData, undefined>;
export function listMyWorkoutRoutines(dc: DataConnect): QueryPromise<ListMyWorkoutRoutinesData, undefined>;

