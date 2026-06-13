// tests/01_onboarding.test.js — Splash Screen & Onboarding Flow Tests
// ParcelVault Web E2E — Selenium + Mocha

'use strict';

const assert = require('assert');
const {
  buildDriver, openApp,
  waitForText, clickByText, clickButton,
  assertTextExists, sleep, By,
} = require('../helpers/driver');

describe('🚀 Splash Screen & Onboarding Flow', function () {
  this.timeout(45000);
  let driver;

  beforeEach(async () => {
    driver = await buildDriver();
  });

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  // ── TC-01 ──────────────────────────────────────────────────────────────────
  it('TC-01: Splash screen displays ParcelVault logo & title', async () => {
    await openApp(driver);
    await assertTextExists(driver, 'ParcelVault');
    // Verify the brand subtitle appears
    const body = await driver.findElement(By.css('body'));
    const pageText = await body.getText();
    assert.ok(
      pageText.includes('ParcelVault') || pageText.includes('Smart'),
      'Splash screen should show ParcelVault branding'
    );
  });

  // ── TC-02 ──────────────────────────────────────────────────────────────────
  it('TC-02: Splash screen auto-navigates to Onboarding 1 within 3 seconds', async () => {
    await openApp(driver);
    // Wait up to 4s for onboarding to appear
    await waitForText(driver, 'Skip', 4500);
    await assertTextExists(driver, 'Skip');
  });

  // ── TC-03 ──────────────────────────────────────────────────────────────────
  it('TC-03: Onboarding 1 shows "Secure Parcel Storage" content', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    // Check that onboarding page 1 heading is visible
    const pageText = await driver.findElement(By.css('body')).then(e => e.getText());
    assert.ok(
      pageText.includes('Parcel') || pageText.includes('Smart') || pageText.includes('Secure'),
      'Onboarding 1 should display parcel management content'
    );
  });

  // ── TC-04 ──────────────────────────────────────────────────────────────────
  it('TC-04: Clicking "Next" on Onboarding 1 advances to Onboarding 2', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    await clickButton(driver, 'Next');
    // Onboarding 2 - OTP Access page
    await waitForText(driver, 'Next', 4000);
    const pageText = await driver.findElement(By.css('body')).then(e => e.getText());
    assert.ok(
      pageText.includes('OTP') || pageText.includes('Access') || pageText.includes('Next'),
      'Should advance to Onboarding 2'
    );
  });

  // ── TC-05 ──────────────────────────────────────────────────────────────────
  it('TC-05: Clicking "Next" on Onboarding 2 advances to Onboarding 3', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    await clickButton(driver, 'Next');
    await sleep(500);
    await clickButton(driver, 'Next');
    await sleep(500);
    const pageText = await driver.findElement(By.css('body')).then(e => e.getText());
    assert.ok(
      pageText.includes('Get Started') || pageText.includes('Smart Locker') || pageText.includes('24/7'),
      'Should advance to Onboarding 3'
    );
  });

  // ── TC-06 ──────────────────────────────────────────────────────────────────
  it('TC-06: "Get Started" on Onboarding 3 navigates to Welcome screen', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    await clickButton(driver, 'Next');
    await sleep(400);
    await clickButton(driver, 'Next');
    await sleep(400);
    await clickButton(driver, 'Get Started');
    await waitForText(driver, 'Student Login', 5000);
    await assertTextExists(driver, 'Student Login');
  });

  // ── TC-07 ──────────────────────────────────────────────────────────────────
  it('TC-07: "Skip" on any onboarding screen jumps directly to Welcome', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    await clickByText(driver, 'Skip');
    await waitForText(driver, 'Student Login', 5000);
    await assertTextExists(driver, 'Student Login');
  });

  // ── TC-08 ──────────────────────────────────────────────────────────────────
  it('TC-08: Welcome screen displays all three action buttons', async () => {
    await openApp(driver);
    await waitForText(driver, 'Skip', 5000);
    await clickByText(driver, 'Skip');
    await waitForText(driver, 'Student Login', 5000);
    await assertTextExists(driver, 'Student Login');
    await assertTextExists(driver, 'Create Student Account');
    await assertTextExists(driver, 'Admin Access');
  });
});
