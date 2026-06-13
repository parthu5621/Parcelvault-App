// android-tests/tests/02_auth.test.js — Android Authentication Tests
// ParcelVault Android (Capacitor) — Appium + WebDriverIO + Mocha

'use strict';

const assert = require('assert');
const {
  buildAppiumDriver, switchToWebView,
  waitForText, clickByText, clickButton,
  typeIntoInput, skipToWelcome, loginAsStudent, loginAsAdmin,
  assertTextExists, getPageText,
} = require('../helpers/appium-driver');

describe('🔐 Android Authentication Tests', function () {
  this.timeout(120000);
  let driver;

  beforeEach(async () => {
    driver = await buildAppiumDriver();
    await driver.pause(5000);
    await switchToWebView(driver);
    await skipToWelcome(driver);
  });

  afterEach(async () => {
    if (driver) await driver.deleteSession();
  });

  // ─── Student Login ──────────────────────────────────────────────────────────

  it('TC-A09: Student Login screen renders on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await assertTextExists(driver, 'Welcome Back');
    const inputs = await driver.$$('input');
    assert.ok(inputs.length >= 2, 'Login form must have email and password inputs');
  });

  it('TC-A10: Student Login shows error for empty fields on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await clickButton(driver, 'Sign In');
    await waitForText(driver, 'Please fill all fields', 5000);
    await assertTextExists(driver, 'Please fill all fields');
  });

  it('TC-A11: Student Login fails with wrong credentials on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await typeIntoInput(driver, 0, 'wrong@email.com');
    await typeIntoInput(driver, 1, 'wrongpassword');
    await clickButton(driver, 'Sign In');
    await waitForText(driver, 'Invalid', 5000);
    await assertTextExists(driver, 'Invalid');
  });

  it('TC-A12: Student Login succeeds with valid credentials on Android', async () => {
    await loginAsStudent(driver);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Dashboard') || pageText.includes('Parcel'),
      'Should navigate to Student Dashboard after login on Android'
    );
  });

  it('TC-A13: Password field masks characters by default on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    const pwdInput = await driver.$('input[type="password"]');
    const type = await pwdInput.getAttribute('type');
    assert.strictEqual(type, 'password', 'Password input type should be "password" (masked)');
  });

  it('TC-A14: Password visibility toggle works on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    // Find and click the eye icon button
    const eyeBtns = await driver.$$('button');
    for (const btn of eyeBtns) {
      const cls = await btn.getAttribute('class');
      if (cls && cls.includes('absolute') && cls.includes('right')) {
        await btn.click();
        break;
      }
    }
    await driver.pause(500);
    const inputs = await driver.$$('input');
    const pwdType = await inputs[1].getAttribute('type');
    assert.strictEqual(pwdType, 'text', 'Password should toggle to text type after clicking eye icon');
  });

  it('TC-A15: Forgot Password link navigates to Forgot Password screen on Android', async () => {
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await clickByText(driver, 'Forgot password?');
    await waitForText(driver, 'Forgot Password', 5000);
    await assertTextExists(driver, 'Forgot Password');
  });

  // ─── Registration ───────────────────────────────────────────────────────────

  it('TC-A16: Registration screen loads on Android', async () => {
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    await assertTextExists(driver, 'Create Account');
  });

  it('TC-A17: Registration fails for mismatched passwords on Android', async () => {
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    const inputs = await driver.$$('input');
    await inputs[0].setValue('Test Android User');
    await inputs[1].setValue(`android${Date.now()}@university.edu`);
    await inputs[2].setValue('+91 99998 77776');
    await inputs[3].setValue('STU997');
    await inputs[4].setValue('pass1234');
    await inputs[5].setValue('pass5678');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Passwords do not match', 5000);
    await assertTextExists(driver, 'Passwords do not match');
  });

  it('TC-A17b: Registration fails when password lacks letters or numbers on Android', async () => {
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    const inputs = await driver.$$('input');
    await inputs[0].setValue('Test Android User');
    await inputs[1].setValue(`android${Date.now()}@university.edu`);
    await inputs[2].setValue('+91 99998 77776');
    await inputs[3].setValue('STU997');
    await inputs[4].setValue('onlyletters');
    await inputs[5].setValue('onlyletters');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'both letters and numbers', 5000);
    await assertTextExists(driver, 'both letters and numbers');
  });

  it('TC-A18: Successful student registration on Android redirects to Login', async () => {
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    const inputs = await driver.$$('input');
    const uid = Date.now();
    await inputs[0].setValue('New Android Student');
    await inputs[1].setValue(`newandroid${uid}@university.edu`);
    await inputs[2].setValue('+91 88887 66665');
    await inputs[3].setValue(`STU${uid}`);
    await inputs[4].setValue('securePass99');
    await inputs[5].setValue('securePass99');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Account created', 8000);
    await assertTextExists(driver, 'Account created');
  });

  // ─── Admin Login ────────────────────────────────────────────────────────────

  it('TC-A19: Admin Login screen loads on Android', async () => {
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);
    await assertTextExists(driver, 'Admin Login');
  });

  it('TC-A20: Admin Login succeeds with admin credentials on Android', async () => {
    await loginAsAdmin(driver);
    const pageText = await getPageText(driver);
    assert.ok(
      pageText.includes('Admin') || pageText.includes('Dashboard'),
      'Should navigate to Admin Dashboard after admin login on Android'
    );
  });

  it('TC-A21: Admin Login fails with student credentials on Android', async () => {
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);
    await typeIntoInput(driver, 0, 'alex@university.edu');
    await typeIntoInput(driver, 1, '123456');
    await clickButton(driver, 'Admin Sign In');
    await waitForText(driver, 'Invalid admin credentials', 5000);
    await assertTextExists(driver, 'Invalid admin credentials');
  });
});
