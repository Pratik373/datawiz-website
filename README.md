# 🚀 Datawiz — CDAC C-CAT & Data Science Prep Platform

[![Platform](https://img.shields.io/badge/Platform-datawiz.in-blue?style=for-the-badge&logo=react)](https://datawiz.in)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?style=for-the-badge)](https://github.com/Pratik373/datawiz-website)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-orange?style=for-the-badge)](https://github.com/Pratik373/datawiz-website/pulls)

**[Datawiz](https://datawiz.in)** is a free, open-source educational platform designed specifically for CDAC C-CAT aspirants and data science students. Our mission is to democratize CDAC exam preparation, making high-quality study resources and tests accessible to students who cannot afford expensive paid coaching. 

We publish free full-length mock tests, section-wise practice questions, the latest AI news, and curated study materials — all freely accessible with absolutely no paywalls. The project is entirely student-contributed and community-driven.

---

## 🎯 Our Mission & Claude AI Integration

Our core goal is to **democratize CDAC exam preparation** for students across India. By offering high-quality resources for free, we aim to level the playing field.

To achieve this goal with high quality and velocity, we leverage **Claude AI** as a core virtual contributor and co-pilot. We plan to use Claude to:
- **Review Pull Requests**: Provide inline, constructive feedback for community contributors to keep code quality high.
- **Bug Triage & Fixes**: Identify, diagnose, and resolve frontend/backend issues reported by students and developers.
- **Documentation**: Write and refine user documentation, developer guides, and high-impact exam strategy articles.
- **Mock Test Validation**: Generate new practice questions and rigorously validate test paper data sets for technical accuracy.
- **Content Creation**: Assist in crafting educational blog posts on AI, Machine Learning, and computer science topics for our student audience.

*Claude's assistance directly improves the quality and delivery velocity of educational materials, helping us support thousands of free users.*

---

## ✨ Features

- 📝 **Full-Length Mock Tests**: Interactive 100-question practice papers styled exactly like the actual C-CAT exam (Section A & Section B).
- ⏱️ **Real-Time Exam Interface**: Simulates the real test portal environment with timers, section tabs, question navigation palettes, and instant review with explanations.
- 📚 **Study Material Hub**: Curated study notes, guides, syllabus breakdowns, and course comparison matrices.
- 📰 **AI & Tech Blogs**: Educational articles on cutting-edge developments in AI/ML and computer science.
- 🔒 **Admin Portal & Dashboards**: Secured dashboard for management to seed test papers, track subscriptions, manage admin credentials, and monitor database statistics.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v7, Tailwind CSS, PostCSS.
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security).
- **Payment API**: Razorpay (Integration ready).
- **Hosting / Deployments**: Vercel.

---

## 📁 Repository Structure

```text
├── React/                   # Frontend React Application
│   ├── public/              # Public assets & static HTML mock test portals
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── pages/           # Page containers (Home, Blogs, TestPortal, AdminDashboard)
│   │   ├── index.js         # React entrypoint
│   │   └── supabaseClient.js# Supabase API client
│   ├── tailwind.config.js   # Tailwind layout styling
│   └── package.json         # Frontend dependencies & scripts
│
├── scripts/                 # Automation & compilation scripts
│   └── convert-md-tests.js  # Compiles Markdown mock test sets into interactive HTML tests
│
├── supabase/                # Supabase database configuration & migrations
│   ├── migrations/          # SQL database schemas & seed files
│   └── config.toml          # Supabase CLI settings
│
├── create-admin.js          # Script to create/link administrator accounts
├── query-db.js              # Debugging script to query database entries
├── update-sets.js           # Script to auto-enable exam timer start calls
├── revert-start.js          # Script to revert exam timer auto-starts
└── package.json             # Root development utilities package
```

---

## 🚀 Local Setup & Installation

Follow these steps to run Datawiz on your local machine:

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 2. Clone the Repository
```bash
git clone https://github.com/Pratik373/datawiz-website.git
cd datawiz-website
```

### 3. Setup Frontend Environment Variables
1. Navigate to the `React` directory:
   ```bash
   cd React
   ```
2. Create/edit your `.env` or `.env.local` file with the following Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

### 4. Install Frontend Dependencies & Run Dev Server
```bash
npm install
npm start
```
The React development server will start at `http://localhost:3000`.

---

## ⚙️ Backend & Database Configuration (Supabase)

The admin dashboard and email subscriptions depend on a Supabase PostgreSQL backend.

### 1. Database Schema
Ensure your Supabase database has the following tables:
- **`emails`**: Captures newsletter/subscription leads.
- **`admin_users`**: Associates authorized emails with admin authentication IDs.
- **`test_papers`**: Stores custom mock tests.

#### Emails Table SQL Schema:
```sql
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Create the Admin User
To gain access to `/admin/dashboard`, run the root utility script to seed an administrator account:

1. Under the root folder (`datawiz-website`), create a `.env.local` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-secret-supabase-service-role-key
   ```
2. Install root-level helper dependencies:
   ```bash
   npm install
   ```
3. Run the script:
   ```bash
   node create-admin.js
   ```

---

## 🧰 Utility & Automation Scripts

We use serverless Node.js scripts in the root directory to automate regular content tasks:

- **`node scripts/convert-md-tests.js`**:
  Converts mock test questions written in human-readable Markdown format (e.g. `CCAT_Mock_Test_Set1.md`) into feature-rich interactive HTML code files located in `React/public/`.
- **`node update-sets.js` / `node revert-start.js`**:
  Automatically injects or removes the `startExam();` initializers in the public HTML mock test sets to manage exam flow rules.
- **`node query-db.js`**:
  Quickly pulls and verifies existing test paper rows directly from the connected Supabase instance.

---

## 🤝 Contributing

We welcome contributions from students, mentors, developers, and educators! Here is how you can get started:

1. **Find an Issue**: Browse open issues or report new ones.
2. **Fork & Branch**: Create a feature branch off of `main`.
3. **Submit a PR**: Make your changes and submit a pull request.
4. **AI Review**: Claude will review your PR and provide initial review comments to assist our maintainers.

---

## 📄 License & Community

Datawiz is licensed under the [MIT License](LICENSE).
Copyright © 2026. Made with ❤️ by students, for students.
For support, contact us at: **allaboutstatistics19@gmail.com**
