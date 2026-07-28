import { useCallback, useEffect, useMemo, useState } from "react";
import { loadAllDayKeys, loadDay, saveDay } from "../storage/entriesStorage.ts";
import { todayKey } from "../utils/date.ts";
import { totalCalories } from "../utils/calories.ts";
import type { Entry, FoodAnalysis } from "../types.ts";

type DaysMap = Record<string, Entry[]>;

function persistDay(days: DaysMap, dateKey: string, entries: Entry[]): DaysMap {
  saveDay(dateKey, entries);
  return { ...days, [dateKey]: entries };
}

function withDayInOrder(order: string[], dateKey: string): string[] {
  return order.includes(dateKey) ? order : [dateKey, ...order];
}

/**
 * Owns the calorie-entry journal: loading it from storage, adding/removing
 * entries for today, and tracking which day cards are expanded.
 */
export function useEntries() {
  const [days, setDays] = useState<DaysMap>({});
  const [dayOrder, setDayOrder] = useState<string[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({ [todayKey()]: true });

  const refreshAll = useCallback(() => {
    const keys = loadAllDayKeys();
    const tKey = todayKey();
    const allKeys = keys.includes(tKey) ? keys : [tKey, ...keys];
    const entries: DaysMap = {};
    for (const k of allKeys) entries[k] = loadDay(k);
    setDays(entries);
    setDayOrder(allKeys);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const commitEntry = useCallback((analysis: FoodAnalysis) => {
    const tKey = todayKey();
    const entry: Entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      ...analysis,
    };
    setDays((d) => persistDay(d, tKey, [...(d[tKey] || []), entry]));
    setDayOrder((order) => withDayInOrder(order, tKey));
    setExpandedDays((e) => ({ ...e, [tKey]: true }));
  }, []);

  const deleteEntry = useCallback((dateKey: string, entryId: string) => {
    setDays((d) => persistDay(d, dateKey, (d[dateKey] || []).filter((e) => e.id !== entryId)));
  }, []);

  const toggleDay = useCallback((dateKey: string) => {
    setExpandedDays((e) => ({ ...e, [dateKey]: !e[dateKey] }));
  }, []);

  const todaysEntries = useMemo(() => days[todayKey()] || [], [days]);
  const todaysTotal = useMemo(() => totalCalories(todaysEntries), [todaysEntries]);

  return {
    days,
    dayOrder,
    expandedDays,
    todaysEntries,
    todaysTotal,
    commitEntry,
    deleteEntry,
    toggleDay,
  };
}
