import { useState, useEffect, type FormEvent } from 'react';
import type { Expense, Category } from '../../types/expense';
import { CATEGORY_NAMES } from '../../utils/categories';
import styles from './ExpenseForm.module.css';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (expense: Expense) => void;
  onCancel?: () => void;
}

interface FormErrors {
  amount?: string;
  category?: string;
  date?: string;
}

export default function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = !!expense;

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setDate(expense.date);
      setDescription(expense.description);
    } else {
      resetForm();
    }
  }, [expense]);

  function resetForm() {
    setAmount('');
    setCategory('');
    setDate('');
    setDescription('');
    setErrors({});
  }

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }
    return newErrors;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const newExpense: Expense = {
      id: expense?.id ?? crypto.randomUUID(),
      amount: parseFloat(amount),
      category: category as Category,
      date,
      description: description.trim(),
    };

    onSubmit(newExpense);
    if (!isEditing) {
      resetForm();
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="amount">Amount ($)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <span className={styles.error}>{errors.amount}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="">Select category</option>
            {CATEGORY_NAMES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <span className={styles.error}>{errors.category}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className={styles.error}>{errors.date}</span>}
        </div>

        <div className={`${styles.field} ${styles.fieldFullWidth}`}>
          <label htmlFor="description">Description (optional)</label>
          <input
            id="description"
            type="text"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton}>
          {isEditing ? 'Save Changes' : 'Add Expense'}
        </button>
        {isEditing && onCancel && (
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
