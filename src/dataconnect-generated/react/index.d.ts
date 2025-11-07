import { CreateUserData, ListExercisesData, UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables, ListMyWorkoutRoutinesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListExercises(options?: useDataConnectQueryOptions<ListExercisesData>): UseDataConnectQueryResult<ListExercisesData, undefined>;
export function useListExercises(dc: DataConnect, options?: useDataConnectQueryOptions<ListExercisesData>): UseDataConnectQueryResult<ListExercisesData, undefined>;

export function useUpdateWorkoutSessionNotes(options?: useDataConnectMutationOptions<UpdateWorkoutSessionNotesData, FirebaseError, UpdateWorkoutSessionNotesVariables>): UseDataConnectMutationResult<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;
export function useUpdateWorkoutSessionNotes(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateWorkoutSessionNotesData, FirebaseError, UpdateWorkoutSessionNotesVariables>): UseDataConnectMutationResult<UpdateWorkoutSessionNotesData, UpdateWorkoutSessionNotesVariables>;

export function useListMyWorkoutRoutines(options?: useDataConnectQueryOptions<ListMyWorkoutRoutinesData>): UseDataConnectQueryResult<ListMyWorkoutRoutinesData, undefined>;
export function useListMyWorkoutRoutines(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyWorkoutRoutinesData>): UseDataConnectQueryResult<ListMyWorkoutRoutinesData, undefined>;
