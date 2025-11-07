const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'training-tracker',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const listExercisesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListExercises');
}
listExercisesRef.operationName = 'ListExercises';
exports.listExercisesRef = listExercisesRef;

exports.listExercises = function listExercises(dc) {
  return executeQuery(listExercisesRef(dc));
};

const updateWorkoutSessionNotesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateWorkoutSessionNotes', inputVars);
}
updateWorkoutSessionNotesRef.operationName = 'UpdateWorkoutSessionNotes';
exports.updateWorkoutSessionNotesRef = updateWorkoutSessionNotesRef;

exports.updateWorkoutSessionNotes = function updateWorkoutSessionNotes(dcOrVars, vars) {
  return executeMutation(updateWorkoutSessionNotesRef(dcOrVars, vars));
};

const listMyWorkoutRoutinesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyWorkoutRoutines');
}
listMyWorkoutRoutinesRef.operationName = 'ListMyWorkoutRoutines';
exports.listMyWorkoutRoutinesRef = listMyWorkoutRoutinesRef;

exports.listMyWorkoutRoutines = function listMyWorkoutRoutines(dc) {
  return executeQuery(listMyWorkoutRoutinesRef(dc));
};
