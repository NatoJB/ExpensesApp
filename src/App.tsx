import { ExpenseProvider } from './context/ExpenseContext';
import ExpensesPage from './pages/ExpensesPage';
import './App.css';

function App() {
  return (
    <ExpenseProvider>
      <div className="app">
        <header className="appHeader">
          <h1>💰 Expense Tracker</h1>
        </header>
        <main>
          <ExpensesPage />
        </main>
      </div>
    </ExpenseProvider>
  );
}

export default App;
