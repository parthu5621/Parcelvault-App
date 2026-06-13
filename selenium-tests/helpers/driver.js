// helpers/driver.js — Shared WebDriver factory & utilities for ParcelVault tests

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const HEADLESS  = process.env.HEADLESS === 'true';

// ── Driver Factory ────────────────────────────────────────────────────────────
async function buildDriver() {
  const options = new chrome.Options();
  options.addArguments('--window-size=430,932');          // Mobile viewport (iPhone 14 Pro Max)
  options.addArguments('--disable-extensions');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  if (HEADLESS) {
    options.addArguments('--headless=new');
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 15000 });
  return driver;
}

// ── Navigation Helpers ─────────────────────────────────────────────────────────
async function openApp(driver) {
  await driver.get(BASE_URL);
}

// ── Wait Helpers ───────────────────────────────────────────────────────────────
async function waitFor(driver, locator, timeout = 10000) {
  return driver.wait(until.elementLocated(locator), timeout);
}

async function waitForText(driver, text, timeout = 10000) {
  return driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${text}')]`)), timeout);
}

async function waitForVisible(driver, locator, timeout = 10000) {
  const el = await waitFor(driver, locator, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

// ── Click Helpers ──────────────────────────────────────────────────────────────
async function clickByText(driver, text) {
  const el = await waitForText(driver, text);
  await driver.executeScript('arguments[0].scrollIntoView(true);', el);
  await el.click();
}

async function clickButton(driver, partialText) {
  const el = await waitFor(driver, By.xpath(`//button[contains(., '${partialText}')]`));
  await driver.executeScript('arguments[0].scrollIntoView(true);', el);
  await el.click();
}

// ── Input Helpers ──────────────────────────────────────────────────────────────
async function typeIntoInput(driver, index, text) {
  const inputs = await driver.findElements(By.css('input'));
  await inputs[index].clear();
  await inputs[index].sendKeys(text);
}

async function typeIntoInputByType(driver, type, text) {
  const input = await waitFor(driver, By.css(`input[type="${type}"]`));
  await input.clear();
  await input.sendKeys(text);
}

// ── Flow Helpers ───────────────────────────────────────────────────────────────

// Skip through the splash screen (waits 2.5s auto-navigate to onboarding)
async function skipToWelcome(driver) {
  await openApp(driver);
  // Wait for onboarding1 – skip all three screens
  await waitForText(driver, 'Skip', 8000);
  await clickByText(driver, 'Skip');
  // Should now be on Welcome screen
  await waitForText(driver, 'ParcelVault', 5000);
}

// Login as student
async function loginAsStudent(driver, email = 'alex@university.edu', password = '123456') {
  await skipToWelcome(driver);
  await clickButton(driver, 'Student Login');
  await waitForText(driver, 'Welcome Back', 5000);

  const inputs = await driver.findElements(By.css('input'));
  // email input (index 0), password input (index 1)
  await inputs[0].clear();
  await inputs[0].sendKeys(email);
  await inputs[1].clear();
  await inputs[1].sendKeys(password);

  await clickButton(driver, 'Sign In');
  await waitForText(driver, 'Dashboard', 8000);
}

// Login as admin
async function loginAsAdmin(driver, email = 'admin@university.edu', password = 'admin123') {
  await skipToWelcome(driver);
  await clickButton(driver, 'Admin Access');
  await waitForText(driver, 'Admin Login', 5000);

  const inputs = await driver.findElements(By.css('input'));
  await inputs[0].clear();
  await inputs[0].sendKeys(email);
  await inputs[1].clear();
  await inputs[1].sendKeys(password);

  await clickButton(driver, 'Admin Sign In');
  await waitForText(driver, 'Admin', 8000);
}

// ── Assert Helpers ─────────────────────────────────────────────────────────────
async function assertTextExists(driver, text) {
  const el = await waitForText(driver, text);
  const displayed = await el.isDisplayed();
  if (!displayed) throw new Error(`Text "${text}" is not visible on page`);
  return el;
}

async function assertElementExists(driver, locator) {
  const el = await waitFor(driver, locator);
  if (!el) throw new Error(`Element ${locator} not found on page`);
  return el;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = {
  buildDriver, openApp,
  waitFor, waitForText, waitForVisible,
  clickByText, clickButton,
  typeIntoInput, typeIntoInputByType,
  skipToWelcome, loginAsStudent, loginAsAdmin,
  assertTextExists, assertElementExists,
  sleep, By, until, Key, BASE_URL,
};
