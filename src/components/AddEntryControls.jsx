import { useRef, useState } from "react";
import { Camera, Loader2, Plus, Type } from "lucide-react";
import styles from "./AddEntryControls.module.css";

/**
 * @param {{
 *   status: "idle" | "analyzing" | "error",
 *   onPhotoSelected: (file: File) => void,
 *   onTextSubmit: (text: string) => void,
 * }} props
 */
export function AddEntryControls({ status, onPhotoSelected, onTextSubmit }) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textDesc, setTextDesc] = useState("");
  const fileInputRef = useRef(null);
  const isAnalyzing = status === "analyzing";

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhotoSelected(file);
  }

  function submitText() {
    if (!textDesc.trim()) return;
    onTextSubmit(textDesc.trim());
    setTextDesc("");
    setShowTextInput(false);
  }

  return (
    <>
      <div className={styles.row}>
        <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className={styles.photoButton}>
          {isAnalyzing && !showTextInput ? <Loader2 size={17} className="spin" /> : <Camera size={17} />}
          Фото блюда
        </button>
        <button onClick={() => setShowTextInput((v) => !v)} className={styles.textToggle}>
          <Type size={17} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
      </div>

      {showTextInput && (
        <div className={styles.textRow}>
          <input
            value={textDesc}
            onChange={(e) => setTextDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder="Например: тарелка плова, 300 г"
            className={styles.textInput}
          />
          <button onClick={submitText} disabled={isAnalyzing} className={styles.submitButton}>
            {isAnalyzing ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
          </button>
        </div>
      )}
    </>
  );
}
