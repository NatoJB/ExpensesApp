export type Category =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Other';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO date string (YYYY-MM-DD)
  description: string; // can be empty
}
