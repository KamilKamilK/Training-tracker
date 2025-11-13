export const VALIDATION_RULES = {
  measurement: {
    minWeight: 30,
    maxWeight: 300,
    minWaist: 50,
    maxWaist: 200,
  },
  workout: {
    minExercises: 1,
    maxExercises: 15,
    minSets: 1,
    maxSets: 10,
  },
  template: {
    minNameLength: 3,
    maxNameLength: 50,
    minExercises: 1,
    maxExercises: 20,
  },
};