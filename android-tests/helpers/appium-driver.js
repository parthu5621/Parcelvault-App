// helpers/appium-driver.js — Appium WebDriverIO factory for ParcelVault Android
// ParcelVault is a Capacitor app — the UI is a WebView wrapping the React web app.
// Tests switch to the WebView context to interact with HTML elements.

'use strict';

const { remote } = require('webdriverio');

// ── Capabilities ───────────────────────────────────────────────────────────────
// Edit DEVICE_NAME and APP_PATH to match your setup before running tests.
const APPIUM_HOST    = process.env.APPIUM_HOST    || '127.0.0.1';
const APPIUM_PORT    = parseInt(process.env.APPIUM_PORT || '4723');
const DEVICE_NAME    = process.env.DEVICE_NAME    || 'emulator-5554';   // Your AVD name or real device serial
const APP_PATH       = process.env.APP_PATH        ||
  require('path').resolve(__dirname, '../../android/app/build/outputs/apk/debug/app-debug.apk');
const PLATFORM_VER   = process.env.PLATFORM_VER   || '13.0';

const CAPABILITIES = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': DEVICE_NAME,
  'appium:platformVersion': PLATFORM_VER,
  'appium:app': APP_PATH,
  'appium:appPackage': 'com.example.parcelvaultapp',
  'appium:appActivity': 'com.example.parcelvaultapp.MainActivity',
  'appium:autoGrantPermissions': true,
  'appium:noReset': false,
  'appium:newCommandTimeout': 120,
  'appium:chromeOptions': {
    args: ['--disable-web-security']
  }
};

// ── Driver Factory ─────────────────────────────────────────────────────────────
async function buildAppiumDriver() {
  const driver = await remote({
    hostname: APPIUM_HOST,
    port: APPIUM_PORT,
    path: '/',
    capabilities: CAPABILITIES,
    logLevel: 'warn',
  });
  return driver;
}

// ── Context Switching ──────────────────────────────────────────────────────────
// ParcelVault is a Capacitor app — switch to the WebView context after launch.
async function switchToWebView(driver, retries = 5) {
  for (let i = 0; i < retries; i++) {
    await driver.pause(2000);
    const contexts = await driver.getContexts();
    const webCtx = contexts.find(c => c.toString().startsWith('WEBVIEW'));
    if (webCtx) {
      await driver.switchContext(webCtx.toString());
      console.log(`  ✓ Switched to WebView context: ${webCtx}`);
      return;
    }
    console.log(`  ⏳ Waiting for WebView context... (attempt ${i + 1}/${retries})`);
  }
  throw new Error('Could not find WebView context after retries');
}

async function switchToNative(driver) {
  await driver.switchContext('NATIVE_APP');
}

// ── Wait Helpers ───────────────────────────────────────────────────────────────
async function waitForEl(driver, selector, timeout = 15000) {
  const el = await driver.$(selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

async function waitForText(driver, text, timeout = 15000) {
  return waitForEl(driver, `//*[contains(., '${text}')]`, timeout);
}

// ── Click Helpers ──────────────────────────────────────────────────────────────
async function clickByText(driver, text) {
  const el = await waitForText(driver, text);
  await el.click();
}

async function clickButton(driver, partialText) {
  const el = await driver.$(`//button[contains(., '${partialText}')]`);
  await el.waitForDisplayed({ timeout: 10000 });
  await el.click();
}

// ── Input Helpers ──────────────────────────────────────────────────────────────
async function typeIntoInput(driver, index, text) {
  const inputs = await driver.$$('input');
  await inputs[index].clearValue();
  await inputs[index].setValue(text);
}

// ── App Flow Helpers ───────────────────────────────────────────────────────────
async function skipToWelcome(driver) {
  // Wait for splash → auto navigate to onboarding
  await waitForText(driver, 'Skip', 8000);
  await clickByText(driver, 'Skip');
  await waitForText(driver, 'Student Login', 5000);
}

async function loginAsStudent(driver, email = 'alex@university.edu', password = '123456') {
  await skipToWelcome(driver);
  await clickButton(driver, 'Student Login');
  await waitForText(driver, 'Welcome Back', 5000);
  await typeIntoInput(driver, 0, email);
  await typeIntoInput(driver, 1, password);
  await clickButton(driver, 'Sign In');
  await waitForText(driver, 'Dashboard', 8000);
}

async function loginAsAdmin(driver, email = 'admin@university.edu', password = 'admin123') {
  await skipToWelcome(driver);
  await clickByText(driver, 'Admin Access');
  await waitForText(driver, 'Admin Login', 5000);
  await typeIntoInput(driver, 0, email);
  await typeIntoInput(driver, 1, password);
  await clickButton(driver, 'Admin Sign In');
  await waitForText(driver, 'Admin', 8000);
}

// ── Assert Helpers ─────────────────────────────────────────────────────────────
async function assertTextExists(driver, text) {
  const el = await waitForText(driver, text);
  const displayed = await el.isDisplayed();
  if (!displayed) throw new Error(`Text "${text}" is not visible in app`);
  return el;
}

async function getPageText(driver) {
  const body = await driver.$('body');
  return body.getText();
}

module.exports = {
  buildAppiumDriver, switchToWebView, switchToNative,
  waitForEl, waitForText, clickByText, clickButton,
  typeIntoInput, skipToWelcome, loginAsStudent, loginAsAdmin,
  assertTextExists, getPageText,
  CAPABILITIES,
};
