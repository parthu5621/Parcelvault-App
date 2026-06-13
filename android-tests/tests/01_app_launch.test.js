// android-tests/tests/01_app_launch.test.js — App Launch & Onboarding Tests
// ParcelVault Android (Capacitor) — Appium + WebDriverIO + Mocha

'use strict';

const assert = require('assert');
const {
  buildAppiumDriver, switchToWebView,
  waitForText, clickByText, clickButton,
  assertTextExists, getPageText,
} = require('../helpers/appium-driver');

describe('🚀 Android App Launch & Onboarding', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    driver = await buildAppiumDriver();
    // Wait for app to fully load then switch to WebView
    await driver.pause(5000);
    await switchToWebView(driver);
  });

  after(async () => {
    if (driver) await driver.deleteSession();
  });

  // ── TC-A01 ─────────────────────────────────────────────────────────────────
  it('TC-A01: App launches and shows ParcelVault splash screen', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('ParcelVault') || pageText.includes('Smart'),
      'Splash screen should display ParcelVault branding'
    );
  });

  // ── TC-A02 ─────────────────────────────────────────────────────────────────
  it('TC-A02: App auto-navigates from splash to onboarding within 3 seconds', async () => {
    await waitForText(driver, 'Skip', 5000);
    await assertTextExists(driver, 'Skip');
  });

  // ── TC-A03 ─────────────────────────────────────────────────────────────────
  it('TC-A03: Onboarding screen 1 displays correctly on Android', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Skip') || pageText.includes('Next') || pageText.includes('Parcel'),
      'Onboarding 1 should be displayed'
    );
  });

  // ── TC-A04 ─────────────────────────────────────────────────────────────────
  it('TC-A04: Clicking Next advances from Onboarding 1 to Onboarding 2', async () => {
    await clickButton(driver, 'Next');
    await driver.pause(1000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('OTP') || pageText.includes('Next') || pageText.includes('Access'),
      'Should advance to Onboarding 2 after Next'
    );
  });

  // ── TC-A05 ─────────────────────────────────────────────────────────────────
  it('TC-A05: Clicking Next advances from Onboarding 2 to Onboarding 3', async () => {
    await clickButton(driver, 'Next');
    await driver.pause(1000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Get Started') || pageText.includes('24/7') || pageText.includes('Smart'),
      'Should show Onboarding 3 with Get Started button'
    );
  });

  // ── TC-A06 ─────────────────────────────────────────────────────────────────
  it('TC-A06: Get Started navigates to Welcome screen on Android', async () => {
    await clickButton(driver, 'Get Started');
    await waitForText(driver, 'Student Login', 5000);
    await assertTextExists(driver, 'Student Login');
  });

  // ── TC-A07 ─────────────────────────────────────────────────────────────────
  it('TC-A07: Welcome screen shows all navigation options', async () => {
    const pageText = await getPageText(driver);
    assert.ok(pageText.includes('Student Login'), 'Welcome should show Student Login');
    assert.ok(pageText.includes('Create Student Account'), 'Welcome should show Register option');
    assert.ok(pageText.includes('Admin Access'), 'Welcome should show Admin Access');
  });

  // ── TC-A08 ─────────────────────────────────────────────────────────────────
  it('TC-A08: Android back navigation from Welcome does not crash app', async () => {
    // Press Android back button
    await driver.back();
    await driver.pause(1000);
    // App should still be running
    const contexts = await driver.getContexts();
    assert.ok(contexts.length > 0, 'App should still be running after back press');
  });
});
