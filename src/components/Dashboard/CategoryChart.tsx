import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Expense, Category } from '../../types/expense';
import { CATEGORIES } from '../../utils/categories';
import styles from './Dashboard.module.css';

interface CategoryChartProps {
  expenses: Expense[];
}

interface ChartData {
  name: Category;
  value: number;
  color: string;
}

export default function CategoryChart({ expenses }: CategoryChartProps) {
  if (expenses.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Spending by Category</h3>
        <div className={styles.chartEmpty}>No expenses to display yet.</div>
      </div>
    );
  }

  const totals = new Map<Category, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }

  const data: ChartData[] = CATEGORIES
    .filter((c) => totals.has(c.name))
    .map((c) => ({
      name: c.name,
      value: parseFloat((totals.get(c.name) ?? 0).toFixed(2)),
      color: c.color,
    }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
