# ParcelVault — Deployment & E2E Testing Guide

## Architecture Overview

```
Developer Push
      ↓
GitHub Repository (main)
      ↓
GitHub Actions Triggers
      ↓
┌─────────────────────┬──────────────────────────────┐
│  Build Validation   │   Selenium E2E Testing       │
│  (Vite + React)     │   (Chrome Headless + Mocha)  │
└─────────────────────┴──────────────────────────────┘
      ↓
Pass / Fail Report (GitHub Actions tab)
      ↓
npm run deploy → GitHub Pages (manual step)
      ↓
https://parthu5621.github.io/Parcelvault-App/
```

---

## Part 1 — GitHub Pages Deployment

### Prerequisites
- Node.js 18+ installed
- GitHub account with a repository named `Parcelvault-App`
- Repository: `https://github.com/parthu5621/Parcelvault-App`

---

### Step 1 — Push Your Project to GitHub

Run from the project root (`ParcelVault App/`):

```bash
git init
git add .
git commit -m "Initial frontend upload"
git branch -M main
git remote add origin https://github.com/parthu5621/Parcelvault-App.git
git push -u origin main
```

> If you already have a remote set up, just do:
> ```bash
> git add .
> git commit -m "feat: add deployment config and Selenium pipeline"
> git push
> ```

---

### Step 2 — Verify package.json Configuration

Your `package.json` already has the correct configuration:

```json
{
  "homepage": "https://parthu5621.github.io/Parcelvault-App",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

And `vite.config.ts` already has:
```ts
base: '/Parcelvault-App/'
```

✅ No changes needed here.

---

### Step 3 — Configure Production Backend URL

Open `.env.production` and replace the placeholder:

```env
# Replace this with your actual deployed backend URL
VITE_API_URL=https://YOUR_BACKEND_URL_HERE/api
```

**Options to deploy your backend:**
| Platform | Free Tier | How |
|---|---|---|
| [Render](https://render.com) | ✅ Yes | Deploy as a Node.js web service |
| [Railway](https://railway.app) | ✅ Yes (limited) | Connect GitHub repo, auto-deploys |
| [Fly.io](https://fly.io) | ✅ Yes | `fly launch` from backend folder |

After deploying your backend, update `.env.production`:
```env
VITE_API_URL=https://parcelvault-api.onrender.com/api
```

---

### Step 4 — Deploy to GitHub Pages

```bash
npm run deploy
```

This command:
1. Runs `npm run build` (Vite builds to `dist/`)
2. Publishes `dist/` to the `gh-pages` branch via the `gh-pages` npm package

---

### Step 5 — Enable GitHub Pages in Repository Settings

1. Open your GitHub repository: `https://github.com/parthu5621/Parcelvault-App`
2. Go to **Settings → Pages**
3. Under **Build and deployment**:
   - **Source** → `Deploy from a branch`
   - **Branch** → `gh-pages` / `/ (root)`
4. Click **Save**

GitHub Pages will be live at:
```
https://parthu5621.github.io/Parcelvault-App/
```

> ⚠️ It may take 1–3 minutes for the first deployment to go live.

---

### Step 6 — Router Configuration

> **No action needed!**

ParcelVault uses a **custom screen-state router** (not React Router). All navigation is handled via `useState<Screen>` in `App.tsx`. This means:
- There are no URL routes to break
- GitHub Pages 404 issues **do not apply** to this app
- No `HashRouter` change is needed

---

### Step 7 — Redeploy After Changes

Whenever you update the frontend:

```bash
npm run deploy
```

---

## Part 2 — Selenium E2E Testing

### Project Structure

```
ParcelVault App/
│
├── selenium-tests/
│   ├── helpers/
│   │   └── driver.js          # WebDriver factory & shared utils
│   ├── tests/
│   │   ├── 01_onboarding.test.js   # Splash & onboarding tests (TC-01–TC-08)
│   │   ├── 02_auth.test.js         # Login, Register, Admin login (TC-09–TC-27)
│   │   ├── 03_student_flow.test.js # Student dashboard & parcels
│   │   ├── 04_admin_flow.test.js   # Admin dashboard
│   │   └── 05_parcel_management.test.js
│   ├── test-results/          # JUnit XML output (gitignored, generated at runtime)
│   │   └── .gitkeep
│   └── package.json
```

---

### Step 8 — Install Selenium Dependencies

```bash
cd selenium-tests
npm install
```

This installs:
- `selenium-webdriver` — browser automation
- `mocha` — test runner
- `mocha-junit-reporter` — JUnit XML for GitHub Actions

---

### Step 9 — Stable Element IDs for Automation

The following `id` attributes have been added to key UI elements for reliable Selenium targeting:

| Element | ID |
|---|---|
| Student Login button | `student-login-btn` |
| Create Student Account button | `create-account-btn` |
| Admin Access button | `admin-access-btn` |
| Email input (student login) | `email` |
| Password input (student login) | `password` |
| Password visibility toggle | `password-toggle` |
| Sign In button | `login-button` |
| Admin Email input | `admin-email` |
| Admin Password input | `admin-password` |
| Admin Sign In button | `admin-login-button` |
| Register / Create Account button | `register-button` |

**Usage in Selenium tests:**
```js
// By ID (most reliable)
const emailInput = await driver.findElement(By.id('email'));
const loginBtn = await driver.findElement(By.id('login-button'));

// Or use the existing helper (by button text)
await clickButton(driver, 'Sign In');
```

---

### Step 10 — Run Tests Locally

**Prerequisites:**
- Chrome browser installed
- Backend running (`cd backend && npm run seed && npm start`)
- Frontend dev server running (`npm run dev`)

**Run all tests:**
```bash
cd selenium-tests
npm test
```

**Run specific test suites:**
```bash
npm run test:onboarding   # TC-01 to TC-08
npm run test:auth         # TC-09 to TC-27 (Login, Register, Admin)
npm run test:student      # Student dashboard flows
npm run test:admin        # Admin dashboard flows
npm run test:parcels      # Parcel management
```

**Run headless (no browser window):**
```bash
HEADLESS=true npm run test:all
```

---

## Part 3 — GitHub Actions CI/CD

### Step 11 — Automatic Testing on Every Push

The workflow at `.github/workflows/selenium-e2e.yml` automatically runs on every push to `main`, `master`, or `develop`.

**What it does:**
1. Sets up Node.js 22 with npm caching
2. Installs and builds the frontend
3. Seeds and starts the Express backend
4. Starts the Vite dev server
5. Sets up Chrome (headless)
6. Runs all 5 Selenium test suites
7. Uploads JUnit XML results as an artifact
8. Displays pass/fail in the GitHub Actions test reporter

### Step 12 — Trigger GitHub Actions

```bash
git add .
git commit -m "test: update Selenium E2E tests"
git push
```

Then go to:
```
https://github.com/parthu5621/Parcelvault-App/actions
```

You'll see the **ParcelVault — Selenium E2E Tests** workflow running.

---

### Step 13 — View Test Results

After the workflow runs:
1. Go to the Actions run
2. Click **Selenium E2E Test Results** in the left panel
3. See per-test pass/fail status
4. Download the XML artifact from the **Artifacts** section for detailed analysis

---

## Part 4 — Verification Checklist

### After Deployment

- [ ] `https://parthu5621.github.io/Parcelvault-App/` loads
- [ ] Splash screen shows ParcelVault branding
- [ ] Onboarding screens navigate correctly
- [ ] Student login works with `alex@university.edu` / `123456`
- [ ] Admin login works with `admin@university.edu` / `admin123`
- [ ] Page refresh does not show 404 (since no URL routing is used)

### After CI Push

- [ ] GitHub Actions job starts (check Actions tab)
- [ ] All steps complete without error
- [ ] Test report shows green checkmarks

---

## Troubleshooting

### "gh-pages: command not found"
```bash
npm install gh-pages --save-dev
```

### GitHub Pages shows 404
- Check Settings → Pages → Branch is set to `gh-pages`
- Wait 2–3 minutes after deployment

### Selenium tests fail locally
- Ensure Chrome is installed and up to date
- Ensure backend is running on port 3001
- Ensure frontend dev server is running on port 5173
- Try running with `HEADLESS=false` to watch the browser

### GitHub Actions Selenium tests fail
- Check the **Run Selenium E2E Tests** step logs
- Download the test-results artifact for detailed XML
- Verify backend `seed.js` runs without error
