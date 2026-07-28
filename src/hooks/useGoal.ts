import { useCallback, useState } from "react";
import { loadGoal, saveGoal } from "../storage/goalStorage.ts";
import { clampGoal } from "../utils/goal.ts";

/** Owns the daily calorie goal, persisted to localStorage. */
export function useGoal() {
  const [goal, setGoal] = useState<number>(() => loadGoal());
  const [editingGoal, setEditingGoal] = useState(false);

  const handleGoalSave = useCallback((rawValue: string) => {
    const n = clampGoal(rawValue);
    setGoal(n);
    saveGoal(n);
  }, []);

  return { goal, editingGoal, setEditingGoal, handleGoalSave };
}
