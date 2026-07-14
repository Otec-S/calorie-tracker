import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Plus, Type, X } from "lucide-react";
import styles from "./AddEntryControls.module.css";
import type { Status } from "../types.ts";

interface AddEntryControlsProps {
  status: Status;
  onPhotoSelected: (file: File, description?: string) => void;
  onTextSubmit: (text: string) => void;
}

export function AddEntryControls({ status, onPhotoSelected, onTextSubmit }: AddEntryControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textDesc, setTextDesc] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [photoDesc, setPhotoDesc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAnalyzing = status === "analyzing";

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setPhotoDesc("");
  }

  function cancelPendingPhoto() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPhotoDesc("");
  }

  function confirmPendingPhoto() {
    if (!pendingFile) return;
    onPhotoSelected(pendingFile, photoDesc.trim() || undefined);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPhotoDesc("");
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
        <button
          onClick={() => setShowTextInput((v) => !v)}
          className={styles.textToggle}
          aria-label="Описать блюдо текстом"
        >
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

      {pendingFile && pendingPreviewUrl && (
        <div className={styles.pendingPhoto}>
          <div className={styles.pendingPhotoRow}>
            <img src={pendingPreviewUrl} alt="" className={styles.pendingThumb} />
            <input
              value={photoDesc}
              onChange={(e) => setPhotoDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmPendingPhoto()}
              placeholder="Добавь описание, например: без сахара (необязательно)"
              aria-label="Описание к фото блюда"
              className={styles.textInput}
              autoFocus
            />
          </div>
          <div className={styles.pendingPhotoActions}>
            <button
              onClick={cancelPendingPhoto}
              disabled={isAnalyzing}
              className={styles.cancelButton}
              aria-label="Отменить фото"
            >
              <X size={15} />
            </button>
            <button onClick={confirmPendingPhoto} disabled={isAnalyzing} className={styles.submitButton}>
              {isAnalyzing ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
              Оценить
            </button>
          </div>
        </div>
      )}

      {showTextInput && (
        <div className={styles.textRow}>
          <input
            value={textDesc}
            onChange={(e) => setTextDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder="Например: тарелка плова, 300 г"
            aria-label="Описание блюда текстом"
            className={styles.textInput}
          />
          <button
            onClick={submitText}
            disabled={isAnalyzing}
            className={styles.submitButton}
            aria-label="Добавить запись"
          >
            {isAnalyzing ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
          </button>
        </div>
      )}
    </>
  );
}
