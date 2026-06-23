# FinSight AI - AI-Powered Personal Finance & Budget Management

FinSight AI is a modern, premium full-stack personal finance cockpit designed to help users track cash flows, manage monthly budgets, and gain deep visual and AI-driven insights into their spending habits.

---

## 🚀 Key Features

*   **Natural Language AI Quick-Fill**: Speak or type how you talk (e.g., *"Swiggy order 350 INR"* or *"Salary payout 5000 USD"*). The integrated **Google Gemini 2.5 Flash** engine automatically extracts amounts, currencies, categories, and types to instantly auto-fill logging forms.
*   **Dynamic Budget Warning Engine**: Configure monthly spending limits per category. Visual indicators adjust in real-time following strict backend business threshold policies:
    *   🟢 **GREEN**: Safe (&lt; 80% spent)
    *   🟡 **AMBER**: Warning (80% - 100% spent)
    *   🔴 **RED**: Overrun (&gt; 100% spent)
*   **AI Financial Advisor Widget**: A floating interactive chat assistant. Ask questions (e.g., *"What is my remaining food budget?"* or *"Give me a tip to save money"*) and receive custom financial recommendations parsed directly from your transaction ledger context.
*   **Multi-Currency Normalization**: Log transactions in `USD`, `INR`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`, `CHF`, `CNY`, and `AED`. The backend automatically standardizes all analytics charts, trend grids, and budget spent values to `USD` using preset exchange matrices.
*   **Visual Dashboard Analytics**: Powered by `Recharts` featuring bar/line graphs showing historical income vs expenses, savings rates, and pie-chart category breakdowns.
*   **Secure Authentication**: Built on Spring Security and JWT. Features user registration, session logins, secure route guards, automatic token rotation (refresh tokens), and a password recovery flow (forgot/reset verification PIN code).

---

## 🛠️ Technology Stack

### Backend (`finsight-backend`)
*   **Core**: Java 21, Spring Boot 3.4.6, Spring Web MVC
*   **Database & JPA**: Hibernate, Spring Data JPA, MySQL 8
*   **Security**: Spring Security 6, JSON Web Tokens (JWT)
*   **Testing**: JUnit 5, Mockito
*   **Build Tool**: Maven

### Frontend (`finsight-frontend`)
*   **Core**: React 19, Next.js 15 (App Router), TypeScript
*   **Styling**: Tailwind CSS
*   **State & Data Fetching**: TanStack React Query v5, Zustand
*   **Visuals & Icons**: Recharts, Lucide React

---

## 📥 Quick Start Guide

### Prerequisites
*   Java Development Kit (JDK) 21 or higher
*   Node.js 18.x or higher & npm
*   MySQL Server 8

---

### Step 1: Database Setup
1. Open your MySQL client (e.g., MySQL Workbench) and create a database named `finsight_db`:
   ```sql
   CREATE DATABASE finsight_db;
   ```
2. The backend Hibernate configuration is set to `ddl-auto: update`, which automatically generates and seeds all relational tables (including Users, Roles, Categories, Budgets, Incomes, and Expenses) on startup.

---

### Step 2: Start the Backend API
1. Navigate to the `finsight-backend` directory:
   ```bash
   cd finsight-backend
   ```
2. Configure your environment variables. Ensure your Gemini API Key is set to enable AI features (fallbacks are in place if key is empty):
   *   **Windows (PowerShell)**:
       ```powershell
       $env:GEMINI_API_KEY="your-api-key-here"
       ```
   *   **Linux/macOS**:
       ```bash
       export GEMINI_API_KEY="your-api-key-here"
       ```
3. Run the Spring Boot application using the Maven wrapper:
   ```bash
   .\mvnw spring-boot:run
   ```
   The server will start on port `8080`.

---

### Step 3: Start the Frontend UI
1. Navigate to the `finsight-frontend` directory:
   ```bash
   cd finsight-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to explore the platform.

---

## 🧪 Running Automated Tests

To execute the unit tests verifying currency conversions, default categories, budget alerts, user password reset logic, and AI prompt parser mappings:

1. Navigate to `finsight-backend`
2. Run:
   ```powershell
   .\mvnw clean test
   ```
