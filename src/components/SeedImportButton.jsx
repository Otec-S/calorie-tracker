import { Import } from "lucide-react";
import styles from "./SeedImportButton.module.css";

/**
 * @param {{ onImport: () => void }} props
 */
export function SeedImportButton({ onImport }) {
  return (
    <button onClick={onImport} className={styles.button}>
      <Import size={16} />
      Загрузить сегодняшние записи из чата (капучино + овсянка)
    </button>
  );
}
