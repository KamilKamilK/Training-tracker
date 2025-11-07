import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'training-tracker',
  location: 'us-east4'
};

export const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';

export function createUser(dc) {
  return executeMutation(createUserRef(dc));
}

export const listExercisesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListExercises');
}
listExercisesRef.operationName = 'ListExercises';

export function listExercises(dc) {
  return executeQuery(listExercisesRef(dc));
}

export const updateWorkoutSessionNotesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateWorkoutSessionNotes', inputVars);
}
updateWorkoutSessionNotesRef.operationName = 'UpdateWorkoutSessionNotes';

export function updateWorkoutSessionNotes(dcOrVars, vars) {
  return executeMutation(updateWorkoutSessionNotesRef(dcOrVars, vars));
}

export const listMyWorkoutRoutinesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyWorkoutRoutines');
}
listMyWorkoutRoutinesRef.operationName = 'ListMyWorkoutRoutines';

export function listMyWorkoutRoutines(dc) {
  return executeQuery(listMyWorkoutRoutinesRef(dc));
}

