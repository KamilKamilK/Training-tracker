import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

export const saveWorkout = async (name: string, exercises: string[]) => {
  try {
    console.log("💾 Próba zapisu do Firestore...", { name, exercises });
    await addDoc(collection(db, "workouts"), {
      name,
      date: new Date().toISOString(),
      exercises
    });
    console.log("✅ Trening zapisany!");
  } catch (error) {
    console.error("❌ Błąd zapisu:", error);
  }
};

