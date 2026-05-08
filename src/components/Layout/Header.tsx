import styles from './Header.module.css';

interface HeaderProps {
  activeTab: 'dashboard' | 'expenses';
  onTabChange: (tab: 'dashboard' | 'expenses') => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>💰 Expense Tracker</h1>
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.navButtonActive : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'expenses' ? styles.navButtonActive : ''}`}
          onClick={() => onTabChange('expenses')}
        >
          Expenses
        </button>
      </nav>
    </header>
  );
}
