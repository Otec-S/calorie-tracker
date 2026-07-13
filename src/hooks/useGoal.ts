import { useCallback, useState } from "react";
import { loadGoal, saveGoal } from "../storage/goalStorage.ts";

const MIN_GOAL = 500;
const MAX_GOAL = 6000;
const DEFAULT_GOAL = 2300;

/** Owns the daily calorie goal, persisted to localStorage. */
export function useGoal() {
  const [goal, setGoal] = useState<number>(() => loadGoal());
  const [editingGoal, setEditingGoal] = useState(false);

  const handleGoalSave = useCallback((rawValue: string) => {
    const n = Math.max(MIN_GOAL, Math.min(MAX_GOAL, parseInt(rawValue, 10) || DEFAULT_GOAL));
    setGoal(n);
    saveGoal(n);
    setEditingGoal(false);
  }, []);

  return { goal, editingGoal, setEditingGoal, handleGoalSave };
}
