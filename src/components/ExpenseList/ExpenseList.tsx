import type { Expense } from '../../types/expense';
import ExpenseItem from './ExpenseItem';
import styles from './ExpenseList.module.css';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className={styles.emptyState}>
        No expenses yet. Add your first expense above!
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {sorted.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
