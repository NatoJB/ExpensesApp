import { useState } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import Header from './components/Layout/Header';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');

  return (
    <ExpenseProvider>
      <div className="app">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main>{activeTab === 'dashboard' ? <DashboardPage /> : <ExpensesPage />}</main>
      </div>
    </ExpenseProvider>
  );
}

export default App;
