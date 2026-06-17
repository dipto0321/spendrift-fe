# 💰 Spendrift

A modern, minimal personal finance tracking application built with a focus on clarity, scalability, and AI-assisted development.

---

## 🚀 Overview

Spendrift helps users track:

- Daily expenses
- Monthly budgets
- Savings goals
- Financial reports (weekly / monthly / yearly)
- Multi-year spending comparisons
- Needs vs Wants classification

The app is designed as a **tracker-based system**, where each tracker represents an independent financial workspace (e.g., Bangladesh Tracker, Europe Tracker).

---

## 🎯 Project Goals

- Build a clean and intuitive finance tracking experience
- Maintain strong UX with minimal cognitive load
- Enable multi-currency tracking via separate trackers
- Learn modern frontend architecture using real-world patterns
- Experiment with AI-assisted engineering workflows

---

## 🧱 Tech Stack

### Frontend

- TanStack Start
- React
- TypeScript
- TailwindCSS
- ShadCN UI

---

## 🏗️ Architecture

Spendrift follows a **Domain-Driven, Feature-Based Architecture (DDD)**.

Each domain is isolated and self-contained:

```
src/features/
 ├── dashboard/
 ├── expenses/
 ├── budgets/
 ├── reports/
 └── trackers/
```

### Key Principles

- Feature-based structure
- Separation of UI and business logic
- Mock-first development (before backend integration)
- Incremental feature building
- Maintainable and scalable design

---

## 🌍 Tracker System

Each tracker represents an independent financial context:

Example:

- 🇧🇩 Bangladesh Tracker (BDT)
- 🇪🇺 Europe Tracker (EUR)

Each tracker contains:

- Expenses
- Budgets
- Reports
- Future investments (planned)
- Loan tracking (planned)

---

## 💸 Core Features

### Expense Tracking

- Add / edit / delete expenses
- Tag as:
  - Needs
  - Wants
- Filter and group expenses
- View expense history

---

### Budget Management

- Monthly budget setup
- Savings target configuration
- Remaining balance tracking
- Budget health indicator

---

### Financial Reports

- Weekly reports
- Monthly reports
- Yearly reports
- Multi-year comparison
- Analytics:
  - Total spending
  - Min / Max / Average expense

---

## 📊 UI / UX Philosophy

Spendrift is designed to feel:

- Minimal
- Calm
- Modern
- Data-focused

Inspired by:

- Linear
- Notion
- Modern fintech dashboards

---

### Design Principles

- Dark theme first
- High readability
- Clear hierarchy
- Meaningful colors (not decorative)
- Reduced visual noise

---

## 🌑 Theme System

### Dark Theme (Primary)

- Background: `#0B0F14`
- Surface: `#121821`
- Card: `#161C24`
- Text: `#E6EDF3`
- Secondary text: `#9DA7B3`
- Accent: `#4F8CFF`

---

## 📈 Charts

All charts are built using **ShadCN Chart components**.

Installed via:

```bash
pnpm dlx shadcn@latest add chart
```

---

## 🧠 Development Philosophy

This project is built with a strong focus on:

- Learning by building
- AI-assisted development (Claude-driven workflow)
- Step-by-step feature implementation
- Avoiding over-engineering
- Understanding system design deeply

---

## 🔁 Development Workflow

1. Plan feature structure first
2. Break into small steps
3. Implement incrementally
4. Review architecture
5. Commit using conventional commits

Example:

```
feat(expenses): add expense list UI
fix(budget): correct remaining balance calculation
chore(ui): setup shadcn chart components
```

---

## 🧪 Current Status

- ✅ Frontend setup complete
- ⏳ Expense module (in progress)
- ⏳ Budget system (planned)
- ⏳ Reports system (planned)
- ⏳ Backend integration (future phase)

---

## 🚧 Future Improvements

- Investment tracking
- Loan management
- AI-powered financial insights
- Multi-user SaaS support
- Mobile optimization
- Backend integration (FastAPI + PostgreSQL)

---

## 📁 Project Structure

```
src/
 ├── app/
 ├── features/
 │   ├── dashboard/
 │   ├── expenses/
 │   ├── budgets/
 │   ├── reports/
 │   └── trackers/
 │
 ├── shared/
 │   ├── ui/
 │   ├── hooks/
 │   ├── lib/
 │   └── utils/
 │
 └── styles/
```

---

## 🤖 AI-Assisted Development

This project heavily uses AI tools for:

- Architecture planning
- Code explanation
- UI design exploration
- Refactoring suggestions

However, AI is used as:

> A mentor and assistant — not an autopilot.

The goal is **learning by building**, not blind generation.

---

## 📌 Key Learnings

- Simplicity scales better than complexity
- Feature-based architecture improves maintainability
- UI clarity is more important than feature count
- AI is most powerful when used for reasoning, not replacement

---

## 📜 License

Personal project (not licensed yet).

---

## ✨ Author

Dipto Karmakar

Senior Frontend Engineer specializing in:

- React / TypeScript / modern frontend architecture
- Domain-driven design systems
- High-performance UI engineering
- AI-assisted development workflows

This project is a personal initiative to explore modern fintech UX and scalable SaaS architecture.
