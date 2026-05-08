import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { Expense } from '../types/expense';
import { loadExpenses, saveExpenses } from '../utils/storage';

type Action =
  | { type: 'ADD'; payload: Expense }
  | { type: 'UPDATE'; payload: Expense }
  | { type: 'DELETE'; payload: string };

interface ExpenseContextValue {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

function expenseReducer(state: Expense[], action: Action): Expense[] {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state];
    case 'UPDATE':
      return state.map((e) => (e.id === action.payload.id ? action.payload : e));
    case 'DELETE':
      return state.filter((e) => e.id !== action.payload);
    default:
      return state;
  }
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(expenseReducer, [], loadExpenses);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  const addExpense = (expense: Expense) => {
    dispatch({ type: 'ADD', payload: expense });
  };

  const updateExpense = (expense: Expense) => {
    dispatch({ type: 'UPDATE', payload: expense });
  };

  const deleteExpense = (id: string) => {
    dispatch({ type: 'DELETE', payload: id });
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
