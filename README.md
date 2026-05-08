# Expense Tracker

A React + TypeScript web app for tracking personal expenses, built with Vite.

## Features
- Add, edit, and delete expenses
- Categorize expenses (Food, Transport, Entertainment, Shopping, Bills, Health, Other)
- Dashboard with spending summaries and category chart
- Data persists in localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## CI/CD Workflows

This project uses GitHub Actions for automated quality and security checks:

- **Code Review**: Triggered on pull requests to `main`. It uses Junie AI to provide automated code reviews and suggestions.
- **Security Audit**: Triggered on pull requests to `main`. It scans the git diff for accidentally committed secrets (API keys, passwords, etc.) and fails the build if any are detected.
