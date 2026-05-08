import type { Expense } from '../../types/expense';
import styles from './Dashboard.module.css';

interface SummaryCardsProps {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={styles.cards}>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Total Spending (All Time)</div>
        <div className={styles.cardValue}>${totalAllTime.toFixed(2)}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>This Month</div>
        <div className={styles.cardValue}>${totalThisMonth.toFixed(2)}</div>
      </div>
    </div>
  );
}
