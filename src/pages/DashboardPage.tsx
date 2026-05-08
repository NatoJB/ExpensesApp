import { useExpenses } from '../context/ExpenseContext';
import { getCategoryColor } from '../utils/categories';
import SummaryCards from '../components/Dashboard/SummaryCards';
import CategoryChart from '../components/Dashboard/CategoryChart';
import styles from '../components/Dashboard/Dashboard.module.css';

export default function DashboardPage() {
  const { expenses } = useExpenses();

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.dashboard}>
      <h2>Dashboard</h2>
      <SummaryCards expenses={expenses} />
      <CategoryChart expenses={expenses} />

      <div className={styles.recentSection}>
        <h3 className={styles.recentTitle}>Recent Expenses</h3>
        {recentExpenses.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
            No recent expenses.
          </div>
        ) : (
          <div className={styles.recentList}>
            {recentExpenses.map((e) => (
              <div key={e.id} className={styles.recentItem}>
                <div className={styles.recentLeft}>
                  <span
                    className={styles.recentBadge}
                    style={{ backgroundColor: getCategoryColor(e.category) }}
                  >
                    {e.category}
                  </span>
                  <span className={styles.recentDesc}>
                    {e.description || e.category}
                  </span>
                </div>
                <div>
                  <span className={styles.recentAmount}>${e.amount.toFixed(2)}</span>
                  <span className={styles.recentDate}>{e.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
