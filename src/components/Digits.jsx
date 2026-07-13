import styles from "./Digits.module.css";

export function Digits({ value }) {
  return <span className={styles.digits}>{value}</span>;
}
