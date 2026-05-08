import { useState } from 'react';
import type { Expense } from '../types/expense';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseForm from '../components/ExpenseForm/ExpenseForm';
import ExpenseList from '../components/ExpenseList/ExpenseList';
import SummaryCards from '../components/Dashboard/SummaryCards';
import CategoryChart from '../components/Dashboard/CategoryChart';
import styles from './ExpensesPage.module.css';

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  function handleSubmit(expense: Expense) {
    if (editingExpense) {
      updateExpense(expense);
      setEditingExpense(undefined);
    } else {
      addExpense(expense);
    }
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingExpense(undefined);
  }

  return (
    <div>
      <div className={styles.dashboard}>
        <SummaryCards expenses={expenses} />
        <CategoryChart expenses={expenses} />
      </div>

      <h2>Expenses</h2>
      <ExpenseForm
        expense={editingExpense}
        onSubmit={handleSubmit}
        onCancel={editingExpense ? handleCancelEdit : undefined}
      />
      <ExpenseList
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={deleteExpense}
      />
    </div>
  );
}
