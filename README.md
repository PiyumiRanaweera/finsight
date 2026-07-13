# 💰 FinSight

![CI](https://github.com/PiyumiRanaweera/finsight/actions/workflows/ci.yml/badge.svg)

**AI-powered personal finance tracker** — Spring Boot 3, React 18, and Gemini AI, with a full fintech design system and dark mode.

Applies enterprise finance domain knowledge from my ERP internship (double-entry accounting,
audit-grade systems) to a consumer product, built end-to-end with professional engineering
practices: full test pyramid, CI/CD with branch protection, and API-first design.

![Dashboard](docs/screenshots/dashboard-dark.png)

## ✨ Features

- **Interactive dashboard** — gradient balance card with live balance sparkline, category donut chart, per-category breakdown
- **🤖 AI auto-categorization** — describe a transaction, Gemini picks the category
- **🤖 AI monthly insights** — natural-language analysis of spending patterns
- **Transaction management** — add/edit via modal, friendly date grouping, LKR formatting, month filtering
- **🎯 Savings goals** — targets with progress bars, deadlines, and add-money actions
- **👤 Account management** — editable profile, secure password change (current-password verification)
- **🌙 Dark mode** — full theme system with persistent preference
- **Polished UX** — toast notifications, inline form validation powered by structured API errors

| Light | Dark |
|---|---|
| ![Light](docs/screenshots/dashboard-light.png) | ![Dark](docs/screenshots/dashboard-dark.png) |

## 🧪 Engineering Practices

- **Unit tests** — service layer with JUnit 5 + Mockito
- **Integration tests** — full HTTP flows against real PostgreSQL via **Testcontainers**
- **CI/CD** — GitHub Actions on every PR; branch protection requires green checks to merge
- **Global exception handling** — consistent `ErrorResponse` contract with per-field validation errors
- **API documentation** — interactive Swagger UI at `/swagger-ui.html`
- **Health monitoring** — Spring Actuator at `/actuator/health`
- **Secrets management** — all credentials via environment variables

![Transactions](docs/screenshots/transactions-dark.png)
![Goals](docs/screenshots/goals-dark.png)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA |
| Frontend | React 18, Vite, Tailwind CSS 4, Recharts, react-hot-toast |
| Database | PostgreSQL 16 |
| AI | Google Gemini (gemini-2.5-flash) |
| Testing | JUnit 5, Mockito, AssertJ, Testcontainers |
| DevOps | GitHub Actions, Docker |

## 🚀 Getting Started

### Prerequisites
Java 21, Node.js 22+, PostgreSQL 16, Docker (for integration tests)

### Setup
1. Create a PostgreSQL database named `finsight`
2. Set environment variables: `DB_PASSWORD`, `JWT_SECRET`, `GEMINI_API_KEY`
3. Backend: `cd finsight-backend && ./mvnw spring-boot:run` → http://localhost:8080
4. Frontend: `cd finsight-frontend && npm install && npm run dev` → http://localhost:5173

> Default DB port in config is 5433 — adjust `application.properties` if yours differs.

### Run tests

## 🗺️ Roadmap

- [x] Savings goals with progress tracking
- [x] Profile & secure password change
- [x] Dark mode
- [ ] Refresh token rotation & rate limiting
- [ ] 📸 Receipt scanning (Gemini vision)
- [ ] Budgets with overspend projections
- [ ] Spending trend charts

---

*Built by [Piyumi Ranaweera](https://github.com/PiyumiRanaweera) — BSc (Hons) IT undergraduate, SLIIT*

## 🏗️ Architecture
