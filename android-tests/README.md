# ParcelVault — Appium Android E2E Testing Guide

> **37 automated test cases** covering the ParcelVault Android application (built with Capacitor). Tests interact with the app's WebView UI using Appium + WebDriverIO + Mocha.

---

## 🏗️ How It Works

ParcelVault Android is a **Capacitor-wrapped React web app**. The APK embeds a native WebView that renders the same React UI you see at `localhost:5173`.

The Appium tests:
1. Launch the APK on an Android device/emulator
2. Wait for the app to load
3. Switch into the **WebView context** (where the React HTML lives)
4. Interact with HTML elements (buttons, inputs) exactly like web Selenium tests
5. Switch back to **Native context** when testing hardware buttons (e.g. Android Back)

---

## 📋 Prerequisites

### 1. Java Development Kit (JDK)
```
Download: https://www.oracle.com/java/technologies/downloads/
Required: JDK 11 or higher
After install, verify: java -version
```

### 2. Android Studio + Android SDK
```
Download: https://developer.android.com/studio
Required components (via SDK Manager inside Android Studio):
  ✅ Android SDK Platform (API 33 / Android 13 recommended)
  ✅ Android SDK Platform-Tools
  ✅ Android Emulator
  ✅ Intel x86 Atom System Image (for emulator)
```

### 3. Set Environment Variables
Add these to your Windows System Environment Variables:

```powershell
# In Windows search → "Edit the system environment variables" → Environment Variables
ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Java\jdk-XX.X.X

# Add to PATH:
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

Verify in a new terminal:
```powershell
adb --version
java -version
```

### 4. Node.js (≥ 18)
```
Download: https://nodejs.org
Verify: node --version
```

### 5. Appium Server (v2)
```powershell
npm install -g appium
appium --version        # Should show 2.x.x
```

### 6. Appium UiAutomator2 Driver
```powershell
appium driver install uiautomator2
appium driver list      # Should show uiautomator2 installed
```

### 7. Appium Inspector (Optional — for debugging element locators)
```
Download: https://github.com/appium/appium-inspector/releases
```

---

## 📱 Build the Android APK

### Step 1 — Build the React App

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App"
npm run build
```

### Step 2 — Sync with Capacitor

```powershell
npx cap sync android
```

### Step 3 — Build the Debug APK

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App\android"
.\gradlew assembleDebug
```

The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

> 💡 **Important:** Open `android-tests/helpers/appium-driver.js` and update `APP_PATH` if needed,
> or set the `APP_PATH` environment variable.

---

## 📁 Project Structure

```
ParcelVault App/
└── android-tests/                     ← All Appium Android tests
    ├── package.json
    ├── helpers/
    │   └── appium-driver.js          ← Shared Appium utilities & capabilities
    └── tests/
        ├── 01_app_launch.test.js     (TC-A01 to TC-A08)
        ├── 02_auth.test.js           (TC-A09 to TC-A21)
        ├── 03_student_flow.test.js   (TC-A22 to TC-A34)
        └── 04_admin_flow.test.js     (TC-A35 to TC-A45)
```

---

## 📲 Device Setup

### Option A — Android Emulator (Recommended for first run)

1. Open **Android Studio** → **Device Manager** → **Create Virtual Device**
2. Choose: **Pixel 7** (or similar) → **API 33 (Android 13)**
3. Click **Play ▶** to start the emulator
4. Verify it's running:
   ```powershell
   adb devices
   # Should show: emulator-5554   device
   ```

### Option B — Real Android Device

1. On your Android phone: **Settings → About Phone → tap "Build Number" 7 times**
2. Go to **Settings → Developer Options → Enable USB Debugging**
3. Connect via USB cable
4. Verify:
   ```powershell
   adb devices
   # Should show: XXXXXXXX   device
   ```
5. Update `DEVICE_NAME` in `appium-driver.js` to match your device serial.

---

## ⚙️ Configure Before Running

Open `android-tests\helpers\appium-driver.js` and verify/update:

```javascript
const DEVICE_NAME  = process.env.DEVICE_NAME || 'emulator-5554';   // ← your AVD/device ID
const APP_PATH     = process.env.APP_PATH     || '...path to app-debug.apk';
const PLATFORM_VER = process.env.PLATFORM_VER || '13.0';           // ← your Android version
```

Or set environment variables:

```powershell
$env:DEVICE_NAME    = "emulator-5554"
$env:PLATFORM_VER   = "13.0"
$env:APP_PATH       = "c:\Users\91799\Downloads\ParcelVault App\android\app\build\outputs\apk\debug\app-debug.apk"
```

---

## 🚀 Running Tests

### Step 1 — Start Appium Server

In a **dedicated terminal window**, run:

```powershell
appium
```

You should see:
```
[Appium] Welcome to Appium v2.x.x
[Appium] Appium REST http interface listener started on http://0.0.0.0:4723
```

> ✅ Keep Appium running during tests.

### Step 2 — Ensure Device/Emulator is Running

```powershell
adb devices
# emulator-5554   device   ← must show 'device', not 'offline'
```

### Step 3 — Install Appium Test Dependencies

```powershell
cd "c:\Users\91799\Downloads\ParcelVault App\android-tests"
npm install
```

### Step 4 — Run Tests

```powershell
# Run ALL 37 Android tests
npm run test:all

# Run specific suites
npm run test:launch     # TC-A01 to TC-A08  (App Launch & Onboarding)
npm run test:auth       # TC-A09 to TC-A21  (Authentication)
npm run test:student    # TC-A22 to TC-A34  (Student Flow)
npm run test:admin      # TC-A35 to TC-A45  (Admin Flow)
```

---

## 📊 Test Case Reference

| File | Test Cases | Description |
|------|-----------|-------------|
| `01_app_launch.test.js` | TC-A01 → TC-A08 | APK launch, splash, onboarding, Welcome screen |
| `02_auth.test.js` | TC-A09 → TC-A21 | Student login, registration, admin login |
| `03_student_flow.test.js` | TC-A22 → TC-A34 | Dashboard, parcels, OTP, notifications, profile |
| `04_admin_flow.test.js` | TC-A35 → TC-A45 | Admin dashboard, add parcel, user mgmt, logout |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student (Alex Johnson) | `alex@university.edu` | `123456` |
| Admin | `admin@university.edu` | `admin123` |

---

## 🐛 Troubleshooting

### Error: "Could not find WebView context"
The app's WebView takes a few seconds to initialize. The driver automatically retries 5 times.
- Make sure Chrome WebView is enabled on your Android device/emulator
- For emulator: **AVD Manager → Edit → Show Advanced → Enable WebView debugging**

### Error: "Connection refused to 4723"
Appium server is not running. Start it:
```powershell
appium
```

### Error: "No device found" / "offline"
```powershell
adb kill-server
adb start-server
adb devices
```
If using emulator, restart it from Android Studio.

### Error: "App not installed" / "APK not found"
1. Rebuild the APK: `cd android && .\gradlew assembleDebug`
2. Verify the path set in `APP_PATH` environment variable or `appium-driver.js`

### Error: "appPackage not found"
Update the `appPackage` in `appium-driver.js` to match your actual package name:
```powershell
# Find your package name:
adb shell pm list packages | findstr parcel
```
Then update:
```javascript
'appium:appPackage': 'your.actual.package.name',
'appium:appActivity': 'your.actual.package.name.MainActivity',
```

### Tests are too slow
Increase the timeout in `package.json`:
```json
"test:all": "mocha 'tests/**/*.test.js' --timeout 90000 ..."
```

---

## 📋 Full Test Run — Command Sequence

Run these commands in order (each in a separate terminal):

**Terminal 1 — Start Appium:**
```powershell
appium
```

**Terminal 2 — Start Emulator (if not already running):**
```powershell
# Open Android Studio → Device Manager → Play button
# OR use command line:
emulator -avd "Pixel_7_API_33"
```

**Terminal 3 — Run tests:**
```powershell
cd "c:\Users\91799\Downloads\ParcelVault App\android-tests"
$env:DEVICE_NAME = "emulator-5554"
$env:APP_PATH = "c:\Users\91799\Downloads\ParcelVault App\android\app\build\outputs\apk\debug\app-debug.apk"
npm run test:all
```

---

## 🏗️ Architecture Overview

```
Appium Server (port 4723)
        │
        │  WebDriverIO Client
        ▼
Android Emulator / Physical Device
        │
        ├── Native Context  (UiAutomator2)
        │     └── Back button, app switch, permissions
        │
        └── WebView Context  (ChromeDriver embedded)
              └── HTML/React UI elements
                    ├── button, input, div
                    └── All ParcelVault screens
```

---

## ✅ Expected Output (Successful Run)

```
  🚀 Android App Launch & Onboarding
    ✓ TC-A01: App launches and shows ParcelVault splash screen (3201ms)
    ✓ TC-A02: App auto-navigates from splash to onboarding within 3 seconds (2844ms)
    ✓ TC-A03: Onboarding screen 1 displays correctly on Android (1102ms)
    ✓ TC-A04: Clicking Next advances from Onboarding 1 to Onboarding 2 (2233ms)
    ✓ TC-A05: Clicking Next advances from Onboarding 2 to Onboarding 3 (2189ms)
    ✓ TC-A06: Get Started navigates to Welcome screen on Android (2034ms)
    ✓ TC-A07: Welcome screen shows all navigation options (1099ms)
    ✓ TC-A08: Android back navigation from Welcome does not crash app (3422ms)

  🔐 Android Authentication Tests
    ✓ TC-A09: Student Login screen renders on Android (4512ms)
    ... (and so on)

  37 passing (4m 22s)
```
