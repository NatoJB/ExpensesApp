import type { Expense } from '../../types/expense';
import { getCategoryColor } from '../../utils/categories';
import styles from './ExpenseList.module.css';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      onDelete(expense.id);
    }
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <div className={styles.itemTop}>
          <span className={styles.amount}>${expense.amount.toFixed(2)}</span>
          <span
            className={styles.badge}
            style={{ backgroundColor: getCategoryColor(expense.category) }}
          >
            {expense.category}
          </span>
          <span className={styles.date}>{expense.date}</span>
        </div>
        {expense.description && (
          <div className={styles.description}>{expense.description}</div>
        )}
      </div>
      <div className={styles.itemActions}>
        <button className={styles.editButton} onClick={() => onEdit(expense)}>
          Edit
        </button>
        <button className={styles.deleteButton} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
