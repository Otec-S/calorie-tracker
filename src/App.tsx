import { useState } from "react";
import { AppHeader } from "./components/AppHeader.tsx";
import { GoalEditor } from "./components/GoalEditor.tsx";
import { ScaleReadout } from "./components/ScaleReadout.tsx";
import { SeedImportButton } from "./components/SeedImportButton.tsx";
import { AddEntryControls } from "./components/AddEntryControls.tsx";
import { AnalyzingPreview } from "./components/AnalyzingPreview.tsx";
import { ErrorBanner } from "./components/ErrorBanner.tsx";
import { EntryHistory } from "./components/EntryHistory.tsx";
import { useEntries } from "./hooks/useEntries.ts";
import { useGoal } from "./hooks/useGoal.ts";
import { analyzeWithClaude } from "./api/claude.ts";
import { fileToResizedBase64 } from "./utils/image.ts";
import { CHAT_SEED_ENTRIES } from "./data/seedEntries.ts";
import type { Status } from "./types.ts";
import styles from "./App.module.css";

export default function App() {
  const {
    days,
    dayOrder,
    expandedDays,
    todaysEntries,
    todaysTotal,
    commitEntry,
    importSeedEntries,
    deleteEntry,
    toggleDay,
  } = useEntries();
  const { goal, editingGoal, setEditingGoal, handleGoalSave } = useGoal();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const alreadyImportedSeed = todaysEntries.some((e) => e.id?.includes("-seed-"));

  async function handlePhotoSelected(file: File) {
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const base64 = await fileToResizedBase64(file);
      setPendingPreview(`data:image/jpeg;base64,${base64}`);
      const analysis = await analyzeWithClaude({ base64 });
      commitEntry(analysis);
      setStatus("idle");
      setPendingPreview(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Не получилось распознать фото");
      setStatus("error");
      setPendingPreview(null);
    }
  }

  async function handleTextSubmit(text: string) {
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const analysis = await analyzeWithClaude({ text });
      commitEntry(analysis);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Не получилось оценить блюдо");
      setStatus("error");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <AppHeader onToggleGoalEditor={() => setEditingGoal((v) => !v)} />

        {editingGoal && <GoalEditor goal={goal} onSave={handleGoalSave} />}

        <ScaleReadout total={todaysTotal} goal={goal} />

        {!alreadyImportedSeed && <SeedImportButton onImport={() => importSeedEntries(CHAT_SEED_ENTRIES)} />}

        <AddEntryControls status={status} onPhotoSelected={handlePhotoSelected} onTextSubmit={handleTextSubmit} />

        {pendingPreview && status === "analyzing" && <AnalyzingPreview previewSrc={pendingPreview} />}

        {status === "error" && <ErrorBanner message={errorMsg} onDismiss={() => setStatus("idle")} />}

        <EntryHistory
          dayOrder={dayOrder}
          days={days}
          expandedDays={expandedDays}
          onToggleDay={toggleDay}
          onDeleteEntry={deleteEntry}
        />

        <div className={styles.footer}>Оценки калорийности приблизительные · данные хранятся только у тебя</div>
      </div>
    </div>
  );
}
