import { Import } from "lucide-react";
import styles from "./SeedImportButton.module.css";

interface SeedImportButtonProps {
  onImport: () => void;
}

export function SeedImportButton({ onImport }: SeedImportButtonProps) {
  return (
    <button onClick={onImport} className={styles.button}>
      <Import size={16} />
      Загрузить сегодняшние записи из чата (капучино + овсянка)
    </button>
  );
}
