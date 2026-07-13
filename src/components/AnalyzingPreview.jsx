import { Loader2 } from "lucide-react";
import styles from "./AnalyzingPreview.module.css";

/**
 * @param {{ previewSrc: string }} props
 */
export function AnalyzingPreview({ previewSrc }) {
  return (
    <div className={styles.wrapper}>
      <img src={previewSrc} alt="" className={styles.thumb} />
      <span className={styles.label}>
        <Loader2 size={14} className="spin" /> Считаю калории…
      </span>
    </div>
  );
}
