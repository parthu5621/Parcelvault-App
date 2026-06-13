# ParcelVault — Selenium E2E Web Testing Guide

> **74 automated test cases** covering the full ParcelVault web application (Splash → Onboarding → Authentication → Student Flow → Admin Flow → Parcel Lifecycle).

---

## 📋 Prerequisites

Before running tests, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | ≥ 18 | https://nodejs.org |
| Google Chrome | Latest | https://www.google.com/chrome |
| ChromeDriver | Matching Chrome | Auto-installed via npm |
| npm | ≥ 8 | Bundled with Node.js |

---

## 📁 Project Structure

```
ParcelVault App/
├── selenium-tests/                ← All Selenium web tests live here
│   ├── package.json
│   ├── helpers/
│   │   └── driver.js             ← Shared WebDriver utilities
│   └── tests/
│       ├── 01_onboarding.test.js     (TC-01 to TC-08)
│       ├── 02_auth.test.js           (TC-09 to TC-27)
│       ├── 03_student_flow.test.js   (TC-28 to TC-48)
│       ├── 04_admin_flow.test.js     (TC-49 to TC-63)
│       └── 05_parcel_management.test.js (TC-64 to TC-74)
├── .github/workflows/
│   └── selenium-e2e.yml          ← GitHub Actions CI
└── src/ ...                      ← React web app source
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Web App Dependencies

Open a terminal in the `ParcelVault App` root folder:

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App"
npm install
```

### Step 2 — Start the Development Server

The Selenium tests require the app to be running at `http://localhost:5173`.

```powershell
npm run dev
```

> ✅ Leave this running in a separate terminal window.
> You should see: `VITE v6.x  ready in Xms  ➜  Local: http://localhost:5173/`

### Step 3 — Install Selenium Test Dependencies

Open a **second terminal window** and run:

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App\selenium-tests"
npm install
```

This installs:
- `selenium-webdriver` — browser automation
- `mocha` — test runner
- `chromedriver` — Chrome automation driver

---

## ▶️ Running Tests

### Run All Tests (Full Suite — 74 tests)

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App\selenium-tests"
npm run test:all
```

### Run Individual Test Suites

```powershell
# Splash & Onboarding (TC-01 to TC-08)
npm run test:onboarding

# Authentication — Login, Register, Admin (TC-09 to TC-27)
npm run test:auth

# Student Flow — Dashboard, Parcels, OTP, Profile (TC-28 to TC-48)
npm run test:student

# Admin Flow — Dashboard, Add Parcel, User Mgmt (TC-49 to TC-63)
npm run test:admin

# Full Parcel Lifecycle E2E (TC-64 to TC-74)
npm run test:parcels
```

### Run in Headless Mode (No Browser Window — for CI/CD)

```powershell
$env:HEADLESS = "true"
npm run test:headless
```

### Run Against a Different URL (e.g. GitHub Pages deployment)

```powershell
$env:BASE_URL = "https://yourusername.github.io/your-repo"
npm run test:all
```

---

## 🔐 Demo Credentials Used in Tests

| Role | Email | Password |
|------|-------|----------|
| Student (Alex Johnson) | `alex@university.edu` | `123456` |
| Student (Priya Sharma) | `priya@university.edu` | `123456` |
| Admin | `admin@university.edu` | `admin123` |

---

## 📊 Test Case Reference

| File | Test Cases | Description |
|------|-----------|-------------|
| `01_onboarding.test.js` | TC-01 → TC-08 | Splash, onboarding navigation, skip, welcome |
| `02_auth.test.js` | TC-09 → TC-27 | Student login/register, forgot password, admin login |
| `03_student_flow.test.js` | TC-28 → TC-48 | Dashboard, My Parcels, Details, OTP, Notifications, Profile |
| `04_admin_flow.test.js` | TC-49 → TC-63 | Admin dashboard, add parcel, user mgmt, reports |
| `05_parcel_management.test.js` | TC-64 → TC-74 | Full lifecycle, data isolation, settings, logout |

---

## ⚙️ Configuration

You can override settings using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | URL of the running app |
| `HEADLESS` | `false` | Set to `true` for no browser UI |

---

## 🤖 GitHub Actions CI/CD (Automated Testing on Push)

### Step 1 — Push Project to GitHub

```bash
cd "c:\Users\91799\Downloads\ParcelVault App"
git init
git add .
git commit -m "Initial ParcelVault upload"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2 — GitHub Actions Auto-Triggers

Every time you push code, GitHub Actions automatically:
1. ✅ Installs all dependencies
2. ✅ Builds the Vite app
3. ✅ Starts the dev server
4. ✅ Runs all 74 Selenium E2E tests in headless Chrome
5. ✅ Reports pass/fail on the GitHub PR/commit

The workflow file is at: `.github/workflows/selenium-e2e.yml`

---

## 🐛 Troubleshooting

### Error: "Chrome not found"
- Make sure Google Chrome is installed
- Run `npm install` again in `selenium-tests/` to reinstall chromedriver

### Error: "Connection refused / localhost:5173"
- Start the dev server first: `npm run dev` (from the root `ParcelVault App/` folder)
- Wait for the "ready" message before running tests

### Error: "Element not found" / Timeout
- The app may be slow to load. Increase timeout:
  ```powershell
  # Temporarily set longer timeout
  $env:MOCHA_TIMEOUT = "60000"
  npm run test:all -- --timeout 60000
  ```

### Tests pass locally but fail on CI
- Enable headless mode locally to simulate CI: `$env:HEADLESS = "true"`
- Check GitHub Actions logs for specific failures

---

## 📈 CI/CD Architecture

```
Developer pushes code
        │
        ▼
GitHub Repository
        │
        ▼
GitHub Actions Trigger
        │
        ├── npm install (web app)
        ├── npm run build (Vite)
        ├── Start dev server (background)
        ├── npm install (selenium-tests/)
        └── HEADLESS=true npm run test:all
              │
              ├── 74 Selenium E2E Tests
              └── Pass / Fail Report
```
