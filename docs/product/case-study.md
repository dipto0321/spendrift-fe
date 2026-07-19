# Spendrift — Building a Modern Personal Finance Tracker with AI-Assisted Development

## Overview

Spendrift is a modern personal finance management application designed to help users track expenses, manage budgets, monitor savings goals, and analyze spending behavior through insightful reports.

The project initially started as a personal tool to solve a real-world problem: maintaining financial clarity across multiple countries and currencies while keeping the experience simple and distraction-free.

Unlike traditional finance apps overloaded with features, Spendrift focuses on:

* clarity,
* simplicity,
* meaningful analytics,
* and long-term scalability.

The application is being architected in a way that allows it to evolve from a personal productivity tool into a full SaaS product in the future.

---

# The Problem

Most expense tracking apps fall into one of these categories:

* Too complex for everyday use
* Overwhelming interfaces
* Difficult multi-currency management
* Poor budgeting visibility
* Limited personalization
* Heavy feature bloat

Additionally, many tools fail to provide a clean distinction between:

* essential spending ("Needs")
* discretionary spending ("Wants")

This makes it difficult for users to understand their actual financial behavior.

Another important challenge was tracking expenses independently across multiple countries and currencies without turning the app into a banking platform.

---

# Goals

The primary goals of Spendrift were:

## Functional Goals

* Track daily expenses efficiently
* Set monthly budgets
* Monitor savings targets
* Generate weekly/monthly/yearly reports
* Compare spending behavior across years
* Support multiple independent currency trackers

## Technical Goals

* Learn modern full-stack architecture
* Explore AI-assisted development workflows
* Practice agentic coding
* Build scalable foundations for future SaaS expansion
* Keep architecture maintainable and modular

## UX Goals

* Calm and minimal interface
* Modern fintech-inspired design
* Strong readability
* Mobile-friendly experience
* Dark-theme-first design

---

# Product Concept

Spendrift uses a tracker-based architecture.

Each tracker acts as an independent financial workspace.

Examples:

* Bangladesh Tracker (BDT)
* Europe Tracker (EUR)

Each tracker contains:

* Expenses
* Budgets
* Reports
* Future investments and loans

This approach allows users to separate financial contexts cleanly without introducing unnecessary banking complexity.

---

# Core Features

## Expense Tracking

Users can:

* Add expenses
* Edit/delete expenses
* Categorize expenses
* Mark expenses as:

  * Needs
  * Wants

This helps users visualize spending priorities and habits.

### Bulk Entry

The single-expense modal becomes painful at the volume real users hit
(~8 entries/day on average). The **Add multiple** action opens a wider
modal with a shared date and a `useFieldArray` row grid; saves run in
parallel via `Promise.allSettled`, so one failed row doesn't sink the
batch — failed rows stay in the grid with a banner and a retry action.

### AI Smart Paste

For the most common daily pattern ("I bought three things on the way
home"), the bulk modal offers a **Smart paste** section: paste free-form
text like `coffee 120, bus 40, lunch 350 need`, click *Parse*, and the
backend's `/ai/parse-expenses` proxy returns structured candidate rows
that are **appended to the review grid**. The AI never persists
directly — the user always sees and edits the rows before saving. This
keeps the user in control while removing the typing overhead.

---

## Budget Management

Users can:

* Set monthly budget limits
* Define savings targets
* Track remaining spendable balance

The application dynamically calculates:

* Remaining budget
* Safe spending range
* Savings health status

---

## Budget Alerts

When the user's **Budget alerts** preference is enabled, the dashboard
surfaces a dismissible alert banner listing any category that has crossed
its warning or exceeded threshold for the selected month. The flag itself
lives server-side (`GET/PUT /preferences`), so it follows the user across
devices.

---

## Catch-Up Recency

Knowing "when did I last log expenses" used to require opening
`/expenses` and scanning. The dashboard now carries an ambient **last
entry** line — a muted one-liner while caught up, a calm primary-tinted
nudge once 2+ days have passed. The nudge's **Catch up** button deep-links
to `/expenses?bulk=1`, which auto-opens the bulk modal once and strips
the search param. The data comes from the existing expenses list
endpoint with `sort=date_desc&limit=1` — no backend work required, and
the threshold is tuned to avoid nagging on single quiet days.

---

## Savings Status Indicator

The system visually communicates financial health using:

* Green → within savings target
* Red → overspending
* Yellow → insufficient data / neutral

This provides instant financial awareness without overwhelming the user with numbers.

---

## Reports & Analytics

The reporting system includes:

* Weekly reports
* Monthly reports
* Yearly reports

Analytics include:

* Total spending
* Minimum expense
* Maximum expense
* Average expense

Users can also compare multiple years to identify spending trends and behavioral changes over time.

---

## User Preferences

Three per-user toggles are stored server-side (`/preferences`):

* **Budget alerts** — enable the dashboard alert banner
* **Weekly summary** — reserved flag, feature pending
* **Round amounts** — when on, every money surface (cards, charts,
  expense rows, tooltips) renders integer amounts via the shared
  `useFormatCurrency()` hook

The Settings page uses optimistic updates so the UI responds instantly;
mutations are rolled back (with a toast) on API error. The whole flag
lives on the backend — no localStorage shadow state — so it follows the
user across devices.

---

# Design Philosophy

The UI design was inspired by:

* Linear
* Notion
* Modern SaaS dashboards
* Fintech analytics platforms

Key principles:

* Minimalism
* Whitespace-first design
* Data clarity
* Low cognitive load
* Soft dark theme

The goal was to make financial management feel calm rather than stressful.

---

# Technical Architecture

## Frontend

* TanStack Start
* React
* TypeScript
* TailwindCSS
* ShadCN UI

The frontend follows a feature-based architecture to keep the codebase scalable and maintainable.

---

## Backend

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic

The backend (a tracker-scoped REST API with JWT auth) is built and **fully
integrated** — every feature (trackers, expenses, budgets, dashboard, reports)
is server-backed. The frontend reaches it through one repository seam per
feature, mapping the API's `snake_case` and Decimal-string money to the domain
model at the `dto.ts` boundary. It follows modular architecture principles with
future SaaS scalability in mind.

---

# AI-Assisted Development

One of the most unique aspects of Spendrift is its development process.

The project is also being used as an experiment in:

* AI-assisted engineering
* Agentic coding
* Vibe coding workflows

Tools explored during development include:

* Cursor
* GitHub Copilot
* Claude
* Gemini
* Codex
* OpenCode.ai

However, the development philosophy intentionally avoids blind AI code generation.

Instead, AI is treated as:

* a pair programmer,
* architecture reviewer,
* mentor,
* and productivity accelerator.

The focus remains on:

* understanding systems deeply,
* learning by building,
* and maintaining engineering ownership.

---

# Challenges

## Avoiding Overengineering

One major challenge was balancing:

* scalability,
* modularity,
* and simplicity.

The application intentionally avoids premature microservices or excessive abstraction in the early stages.

---

## Multi-Currency Design

Supporting multiple currencies without introducing banking complexity required rethinking the data model around independent trackers rather than financial accounts.

---

## AI Workflow Management

Another challenge was learning how to effectively collaborate with AI tools without becoming dependent on them.

This led to experimenting with:

* custom Cursor rules,
* skills,
* subagents,
* and structured AI context systems.

---

# Future Vision

Potential future roadmap includes:

* Investment tracking
* Loan management
* Shared budgets
* Multi-user collaboration
* AI-powered financial insights
* SaaS deployment
* Product Hunt launch

---

# Key Learnings

Building Spendrift reinforced several important engineering lessons:

* Simplicity scales better than premature complexity
* Strong UX matters more than feature quantity
* AI is most powerful as a collaborator, not an autopilot
* Feature-based architecture improves maintainability
* Designing before coding dramatically improves implementation clarity

---

# Conclusion

Spendrift is more than just a finance app.

It represents:

* a practical engineering journey,
* a modern AI-assisted development workflow,
* and a long-term product-building experiment.

The project combines:

* full-stack engineering,
* thoughtful UX design,
* scalable architecture,
* and modern developer tooling

into a learning-focused but production-minded application.
