import { useState } from "react";
import { AppHeader } from "./components/AppHeader.jsx";
import { GoalEditor } from "./components/GoalEditor.jsx";
import { ScaleReadout } from "./components/ScaleReadout.jsx";
import { SeedImportButton } from "./components/SeedImportButton.jsx";
import { AddEntryControls } from "./components/AddEntryControls.jsx";
import { AnalyzingPreview } from "./components/AnalyzingPreview.jsx";
import { ErrorBanner } from "./components/ErrorBanner.jsx";
import { EntryHistory } from "./components/EntryHistory.jsx";
import { useEntries } from "./hooks/useEntries.js";
import { useGoal } from "./hooks/useGoal.js";
import { analyzeWithClaude } from "./api/claude.js";
import { fileToResizedBase64 } from "./utils/image.js";
import { CHAT_SEED_ENTRIES } from "./data/seedEntries.js";
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

  const [status, setStatus] = useState("idle"); // idle | analyzing | error
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingPreview, setPendingPreview] = useState(null);

  const alreadyImportedSeed = todaysEntries.some((e) => e.id?.includes("-seed-"));

  async function handlePhotoSelected(file) {
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
      setErrorMsg(err.message || "Не получилось распознать фото");
      setStatus("error");
      setPendingPreview(null);
    }
  }

  async function handleTextSubmit(text) {
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const analysis = await analyzeWithClaude({ text });
      commitEntry(analysis);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Не получилось оценить блюдо");
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
