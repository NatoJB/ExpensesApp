import type { Expense } from '../types/expense';

const STORAGE_KEY = 'expenses-app-data';

export function loadExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Expense[];
    }
  } catch (error) {
    console.error('Failed to load expenses from localStorage:', error);
  }
  return [];
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses to localStorage:', error);
  }
}
