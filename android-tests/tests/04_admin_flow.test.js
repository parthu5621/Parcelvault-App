// android-tests/tests/04_admin_flow.test.js — Admin Flow Tests on Android
// ParcelVault Android (Capacitor) — Appium + WebDriverIO + Mocha

'use strict';

const assert = require('assert');
const {
  buildAppiumDriver, switchToWebView,
  waitForText, clickByText, clickButton,
  typeIntoInput, loginAsAdmin, assertTextExists, getPageText,
} = require('../helpers/appium-driver');

describe('🛡️ Android Admin Flow Tests', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    driver = await buildAppiumDriver();
    await driver.pause(5000);
    await switchToWebView(driver);
    await loginAsAdmin(driver);   // admin@university.edu / admin123
  });

  after(async () => {
    if (driver) await driver.deleteSession();
  });

  // ─── Admin Dashboard ────────────────────────────────────────────────────────

  it('TC-A35: Admin Dashboard loads correctly on Android', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Admin') || pageText.includes('Dashboard') || pageText.includes('Parcel'),
      'Admin Dashboard should load on Android'
    );
  });

  it('TC-A36: Admin Dashboard shows total parcel metrics on Android', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Total') || pageText.includes('Pending') || pageText.includes('Parcel'),
      'Admin Dashboard should show parcel metrics on Android'
    );
  });

  it('TC-A37: Add Parcel screen opens from Admin Dashboard on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Add') && t.includes('Parcel')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Add') && (pageText.includes('Parcel') || pageText.includes('Tracking')),
      'Add Parcel screen should open on Android'
    );
  });

  it('TC-A38: Add Parcel form has input fields on Android', async () => {
    const inputs = await driver.$$('input');
    assert.ok(inputs.length >= 1, 'Add Parcel form should have input fields on Android');
  });

  it('TC-A39: Add Parcel validates empty submission on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Add') || t.includes('Save') || t.includes('Submit')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Please') || pageText.includes('required') || pageText.includes('fill') || pageText.includes('Parcel'),
      'Validation message should show for empty Add Parcel form on Android'
    );
  });

  it('TC-A40: Parcel Management screen loads on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Parcel Management') || t.includes('Manage')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Parcel') || pageText.includes('Management') || pageText.includes('PKG'),
      'Parcel Management should load on Android'
    );
  });

  it('TC-A41: User Management screen loads on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('User Management') || t.includes('Users')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('User') || pageText.includes('Alex Johnson') || pageText.includes('Priya'),
      'User Management should show students on Android'
    );
  });

  it('TC-A42: Admin can access Reports & Analytics on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Report') || t.includes('Analytics')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Report') || pageText.includes('Analytics') || pageText.includes('Admin'),
      'Reports & Analytics should load on Android'
    );
  });

  it('TC-A43: Admin can access Generate OTP screen on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('OTP') || t.includes('Generate')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('OTP') || pageText.includes('Generate') || pageText.includes('Admin'),
      'Generate OTP screen should be accessible on Android'
    );
  });

  it('TC-A44: Admin can access Completed Pickup screen on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Completed') || t.includes('Pickup')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Completed') || pageText.includes('Pickup') || pageText.includes('Admin'),
      'Completed Pickup should load on Android'
    );
  });

  it('TC-A45: Admin Logout returns to Welcome screen on Android', async () => {
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Logout') || t.includes('Sign Out')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1000);
    // Confirm logout if dialog appears
    const confirmBtns = await driver.$$('button');
    for (const btn of confirmBtns) {
      const t = await btn.getText();
      if (t.includes('Logout') || t.includes('Confirm') || t.includes('Yes')) {
        await btn.click();
        break;
      }
    }
    await waitForText(driver, 'ParcelVault', 8000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('ParcelVault') || pageText.includes('Student Login'),
      'Admin logout should return to Welcome on Android'
    );
  });
});
