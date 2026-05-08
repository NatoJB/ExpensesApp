import type { Category } from '../types/expense';

export interface CategoryInfo {
  name: Category;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { name: 'Food', label: 'Food', color: '#ef4444' },
  { name: 'Transport', label: 'Transport', color: '#3b82f6' },
  { name: 'Entertainment', label: 'Entertainment', color: '#a855f7' },
  { name: 'Shopping', label: 'Shopping', color: '#f59e0b' },
  { name: 'Bills', label: 'Bills', color: '#6366f1' },
  { name: 'Health', label: 'Health', color: '#10b981' },
  { name: 'Other', label: 'Other', color: '#6b7280' },
];

export const CATEGORY_NAMES: Category[] = CATEGORIES.map((c) => c.name);

export function getCategoryColor(category: Category): string {
  return CATEGORIES.find((c) => c.name === category)?.color ?? '#6b7280';
}
