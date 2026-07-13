import { useCallback, useEffect, useMemo, useState } from "react";
import { loadAllDayKeys, loadDay, saveDay } from "../storage/entriesStorage.js";
import { todayKey } from "../utils/date.js";

/** @typedef {import("../types.js").Entry} Entry */
/** @typedef {import("../types.js").FoodAnalysis} FoodAnalysis */

function persistDay(days, dateKey, entries) {
  saveDay(dateKey, entries);
  return { ...days, [dateKey]: entries };
}

function withDayInOrder(order, dateKey) {
  return order.includes(dateKey) ? order : [dateKey, ...order];
}

/**
 * Owns the calorie-entry journal: loading it from storage, adding/removing
 * entries for today, and tracking which day cards are expanded.
 */
export function useEntries() {
  /** @type {[Record<string, Entry[]>, Function]} */
  const [days, setDays] = useState({});
  const [dayOrder, setDayOrder] = useState([]);
  const [expandedDays, setExpandedDays] = useState({ [todayKey()]: true });

  const refreshAll = useCallback(() => {
    const keys = loadAllDayKeys();
    const tKey = todayKey();
    const allKeys = keys.includes(tKey) ? keys : [tKey, ...keys];
    const entries = {};
    for (const k of allKeys) entries[k] = loadDay(k);
    setDays(entries);
    setDayOrder(allKeys);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /** @param {FoodAnalysis} analysis */
  const commitEntry = useCallback((analysis) => {
    const tKey = todayKey();
    /** @type {Entry} */
    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      ...analysis,
    };
    setDays((d) => persistDay(d, tKey, [...(d[tKey] || []), entry]));
    setDayOrder((order) => withDayInOrder(order, tKey));
    setExpandedDays((e) => ({ ...e, [tKey]: true }));
  }, []);

  const importSeedEntries = useCallback((seedEntries) => {
    const tKey = todayKey();
    const stamped = seedEntries.map((s, i) => ({
      id: Date.now() + "-seed-" + i,
      time: "—",
      ...s,
    }));
    setDays((d) => persistDay(d, tKey, [...(d[tKey] || []), ...stamped]));
    setDayOrder((order) => withDayInOrder(order, tKey));
    setExpandedDays((e) => ({ ...e, [tKey]: true }));
  }, []);

  const deleteEntry = useCallback((dateKey, entryId) => {
    setDays((d) => persistDay(d, dateKey, (d[dateKey] || []).filter((e) => e.id !== entryId)));
  }, []);

  const toggleDay = useCallback((dateKey) => {
    setExpandedDays((e) => ({ ...e, [dateKey]: !e[dateKey] }));
  }, []);

  const todaysEntries = useMemo(() => days[todayKey()] || [], [days]);
  const todaysTotal = useMemo(
    () => todaysEntries.reduce((s, e) => s + (e.cal_max || e.cal_min || 0), 0),
    [todaysEntries],
  );

  return {
    days,
    dayOrder,
    expandedDays,
    todaysEntries,
    todaysTotal,
    commitEntry,
    importSeedEntries,
    deleteEntry,
    toggleDay,
  };
}
