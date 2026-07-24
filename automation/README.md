# 📱 ParcelVault Enterprise Android Appium E2E Automation Framework

An enterprise-grade, fully automated mobile QA automation framework and CI/CD pipeline for the ParcelVault Android Application.

---

## 📁 Framework Directory Architecture

```
automation/
├── config/
│   └── appium.config.js          # Appium & Environment Capabilities Config
├── data/
│   └── test_data_generator.js    # Data-Driven Test Data Provider
├── drivers/
│   └── driver_manager.js         # Appium WebDriver Session & Context Manager
├── listeners/                    # Test Event & Assertion Listeners
├── logs/                         # Execution Logs Output Directory
├── pages/                        # Page Object Model (POM) Abstraction Layer
│   ├── base_page.js
│   ├── auth_page.js
│   ├── dashboard_page.js
│   ├── parcels_page.js
│   └── settings_page.js
├── reports/                      # Multi-Format Report Generators & Output
│   ├── excel_report_generator.js
│   ├── html_report_generator.js
│   ├── json_report_generator.js
│   ├── markdown_summary_generator.js
│   ├── Excel/                     # Automation_Test_Report.xlsx, Passed_Test_Cases.xlsx, Failed_Test_Cases.xlsx, Execution_Summary.xlsx
│   ├── HTML/                      # execution-report.html, dashboard.html, trends.html
│   ├── JSON/                      # execution-results.json
│   ├── Summary/                   # summary.md
│   ├── latest/                    # GitHub Pages Latest Copy
│   └── history/                   # Historical Build Archives (build-001, build-002, ...)
├── runners/
│   └── master_e2e_runner.js      # Master Execution Engine (420 Test Cases)
├── screenshots/                  # Failure & Milestone Screenshots
├── tests/
│   └── test_repository.js        # 420 Executable Test Cases across 20 Modules
└── utils/
    ├── logger.js
    ├── retry_handler.js
    └── screenshot_utility.js
```

---

## 📊 Module Distribution (420 Executable Test Cases)

| # | Module Name | Test Count | Prefix | Description |
|---|---|:---:|---|---|
| 1 | **Authentication** | 40 | `TC_AUTH` | Login, PIN, OTP, Biometrics, Logout |
| 2 | **Authorization** | 30 | `TC_PERM` | Student vs Admin Role Access Controls |
| 3 | **Registration** | 20 | `TC_REG` | Student Account Creation & Field Rules |
| 4 | **Profile Management** | 20 | `TC_PROF` | Student Avatar, Phone & Details Edit |
| 5 | **Navigation** | 30 | `TC_NAV` | Bottom Tabs, Screen Transitions, Back Hardware Key |
| 6 | **Dashboard** | 20 | `TC_DASH` | KPI Stat Cards, Recent Activity Feed |
| 7 | **Forms** | 40 | `TC_FORM` | Add Parcel, Assign Locker, Pickup Form Controls |
| 8 | **CRUD Operations** | 40 | `TC_CRUD` | Create, Read, Update, Delete Parcels & Lockers |
| 9 | **Search** | 20 | `TC_SRCH` | Tracking ID, Student Name & Parcel Search |
| 10 | **Filters** | 20 | `TC_FLTR` | Status Filter Tabs (Pending, Ready, Collected) |
| 11 | **Input Validation** | 40 | `TC_VAL` | Regex, Max Length, Special Character Sanitization |
| 12 | **Error Handling** | 20 | `TC_ERR` | Server Timeout, 500 Network Error Fallbacks |
| 13 | **Session Management** | 20 | `TC_SESS` | JWT Token Renewal & Auto Expiry |
| 14 | **Notifications** | 20 | `TC_NOTIF` | Push Alerts & Locker Ready Notifications |
| 15 | **File Upload** | 20 | `TC_FILE` | QR Code Scanning & Receipt Attachment |
| 16 | **Offline Handling** | 10 | `TC_OFF` | Offline Queue & Re-connection Auto-Sync |
| 17 | **Accessibility** | 20 | `TC_A11Y` | ARIA Accessibility Labels & High Contrast |
| 18 | **Responsive UI** | 10 | `TC_RESP` | Portrait / Landscape Screen Layouts |
| 19 | **Performance Smoke Tests** | 20 | `TC_PERF` | Latency SLA (<800ms) & Memory Usage |
| 20 | **Regression Suite** | 50 | `TC_REGR` | Full End-to-End User & Admin Journeys |
| **TOTAL** | **20 MODULES** | **420** | | **100% EXECUTED** |

---

## ⚡ Local Execution Guide

```powershell
# 1. Navigate to automation directory
cd automation

# 2. Install dependencies
npm install

# 3. Start Appium Server (in a separate terminal)
appium

# 4. Execute Master E2E Runner (420 Test Cases + Report Generation)
npm test
```

---

## 🌐 Live GitHub Pages Report URL

After automated CI/CD pipeline execution, reports are deployed live at:
`https://parthu5621.github.io/Parcelvault-App/reports/latest/execution-report.html`

- **Latest Report**: `reports/latest/execution-report.html`
- **Build Archives**: `reports/history/build-XXX/`
