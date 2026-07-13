import styles from "./Digits.module.css";

interface DigitsProps {
  value: number;
}

export function Digits({ value }: DigitsProps) {
  return <span className={styles.digits}>{value}</span>;
}
