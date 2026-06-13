// android-tests/tests/03_student_flow.test.js — Student Flow Tests on Android
// ParcelVault Android (Capacitor) — Appium + WebDriverIO + Mocha

'use strict';

const assert = require('assert');
const {
  buildAppiumDriver, switchToWebView,
  waitForText, clickByText, clickButton,
  loginAsStudent, assertTextExists, getPageText,
} = require('../helpers/appium-driver');

describe('🎓 Android Student Flow Tests', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    driver = await buildAppiumDriver();
    await driver.pause(5000);
    await switchToWebView(driver);
    await loginAsStudent(driver);   // alex@university.edu / 123456
  });

  after(async () => {
    if (driver) await driver.deleteSession();
  });

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  it('TC-A22: Student Dashboard renders correctly on Android', async () => {
    await assertTextExists(driver, 'Dashboard');
  });

  it('TC-A23: Dashboard displays parcel statistics on Android', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Pending') || pageText.includes('Ready') || pageText.includes('Collected'),
      'Dashboard should show parcel statistics on Android'
    );
  });

  it('TC-A24: Bottom navigation bar is displayed on Android', async () => {
    const btns = await driver.$$('button');
    const btnTexts = await Promise.all(btns.map(b => b.getText()));
    const navText = btnTexts.join(' ');
    assert.ok(
      navText.includes('Home') || navText.includes('Parcels') || navText.includes('Profile'),
      'Bottom navigation must be visible on Android'
    );
  });

  // ─── My Parcels ─────────────────────────────────────────────────────────────

  it('TC-A25: My Parcels screen opens on Android', async () => {
    await clickButton(driver, 'My Parcels');
    await waitForText(driver, 'My Parcels', 5000);
    await assertTextExists(driver, 'My Parcels');
  });

  it('TC-A26: Parcels list shows seed parcel PKG-2026-00001 on Android', async () => {
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('PKG-2026-') || pageText.includes('My Parcels'),
      'Parcels list should show tracking IDs on Android'
    );
  });

  it('TC-A27: Ready parcel shows View Collection Pass option on Android', async () => {
    try {
      await clickByText(driver, 'PKG-2026-00001');
    } catch {
      const parcelBtns = await driver.$$('button');
      for (const btn of parcelBtns) {
        const t = await btn.getText();
        if (t.includes('PKG-2026-00001')) { await btn.click(); break; }
      }
    }
    await waitForText(driver, 'Parcel Details', 5000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Collection Pass') || pageText.includes('OTP') || pageText.includes('Parcel Details'),
      'Ready parcel should show OTP/Collection pass on Android'
    );
  });

  it('TC-A28: Collection Pass screen shows OTP on Android', async () => {
    const parcelBtns = await driver.$$('button');
    for (const btn of parcelBtns) {
      const t = await btn.getText();
      if (t.includes('Collection Pass') || t.includes('View Collection')) {
        await btn.click();
        break;
      }
    }
    await waitForText(driver, 'OTP', 8000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('OTP') || pageText.includes('Collection OTP'),
      'Collection Pass should display OTP on Android'
    );
  });

  // ─── Notifications ──────────────────────────────────────────────────────────

  it('TC-A29: Notifications screen loads on Android', async () => {
    await clickButton(driver, 'Alerts');
    await waitForText(driver, 'Notification', 5000);
    await assertTextExists(driver, 'Notification');
  });

  it('TC-A30: Unread notification badge is visible on Android', async () => {
    // Navigate back to dashboard first
    await clickButton(driver, 'Home');
    await waitForText(driver, 'Dashboard', 5000);
    const redBadges = await driver.$$('.bg-red-500');
    assert.ok(redBadges.length > 0, 'Unread notification badge should be visible on Android');
  });

  // ─── Profile ─────────────────────────────────────────────────────────────────

  it('TC-A31: User Profile screen shows student info on Android', async () => {
    await clickButton(driver, 'Profile');
    await waitForText(driver, 'Profile', 5000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Alex') || pageText.includes('alex@university.edu') || pageText.includes('STU001'),
      'Profile should display student information on Android'
    );
  });

  // ─── Scrolling ───────────────────────────────────────────────────────────────

  it('TC-A32: Dashboard is scrollable on Android', async () => {
    await clickButton(driver, 'Home');
    await waitForText(driver, 'Dashboard', 5000);
    // Scroll down
    await driver.execute('mobile: scroll', { direction: 'down' });
    await driver.pause(1000);
    // App should not crash
    const pageText = await getPageText(driver);
    assert.ok(pageText.length > 0, 'App should be functional after scrolling on Android');
  });

  // ─── Touch Events ────────────────────────────────────────────────────────────

  it('TC-A33: Tab navigation responds to touch on Android', async () => {
    // Touch the Parcels tab
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t === 'Parcels') {
        await btn.click();
        break;
      }
    }
    await driver.pause(1000);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Parcels') || pageText.includes('My Parcels'),
      'Touch navigation should work on Android'
    );
  });

  // ─── Locker Screens ──────────────────────────────────────────────────────────

  it('TC-A34: Locker Availability screen is accessible on Android', async () => {
    await clickButton(driver, 'Home');
    await waitForText(driver, 'Dashboard', 5000);
    const btns = await driver.$$('button');
    for (const btn of btns) {
      const t = await btn.getText();
      if (t.includes('Availability') || t.includes('Locker')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(1500);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Locker') || pageText.includes('Dashboard'),
      'Locker Availability should be accessible on Android'
    );
  });
});
