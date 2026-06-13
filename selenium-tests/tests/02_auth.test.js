// tests/02_auth.test.js — Authentication Tests (Student Login, Register, Admin Login, Forgot Password)
// ParcelVault Web E2E — Selenium + Mocha

'use strict';

const assert = require('assert');
const {
  buildDriver, skipToWelcome,
  waitForText, clickByText, clickButton,
  assertTextExists, sleep, By,
} = require('../helpers/driver');

describe('🔐 Authentication Tests', function () {
  this.timeout(45000);
  let driver;

  beforeEach(async () => {
    driver = await buildDriver();
  });

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  // ─── Student Login ──────────────────────────────────────────────────────────

  it('TC-09: Student Login page renders with Email & Password fields', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await assertTextExists(driver, 'Welcome Back');
    const inputs = await driver.findElements(By.css('input'));
    assert.ok(inputs.length >= 2, 'Login form must have at least 2 input fields');
  });

  it('TC-10: Student Login shows error when fields are empty', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await clickButton(driver, 'Sign In');
    await waitForText(driver, 'Please fill all fields', 5000);
    await assertTextExists(driver, 'Please fill all fields');
  });

  it('TC-11: Student Login fails with wrong credentials', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('wrong@email.com');
    await inputs[1].sendKeys('wrongpass');
    await clickButton(driver, 'Sign In');

    await waitForText(driver, 'Invalid', 5000);
    await assertTextExists(driver, 'Invalid');
  });

  it('TC-12: Student Login succeeds with valid credentials (alex@university.edu / 123456)', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('alex@university.edu');
    await inputs[1].sendKeys('123456');
    await clickButton(driver, 'Sign In');

    // Should show success toast then navigate to dashboard
    await waitForText(driver, 'Dashboard', 8000);
    await assertTextExists(driver, 'Dashboard');
  });

  it('TC-13: Student Login - Back button returns to Welcome screen', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);

    // Click back arrow button (first button on screen)
    const backBtn = await driver.findElement(By.css('button'));
    await backBtn.click();
    await waitForText(driver, 'Student Login', 5000);
    await assertTextExists(driver, 'Student Login');
  });

  it('TC-14: Password visibility toggle works on Login screen', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);

    const pwdInput = await driver.findElement(By.css('input[type="password"]'));
    assert.ok(pwdInput, 'Password input should exist');

    // Click the eye icon button (toggles visibility)
    const eyeButtons = await driver.findElements(By.css('button'));
    // Find the eye toggle (usually last small button)
    for (const btn of eyeButtons) {
      const btnClass = await btn.getAttribute('class');
      if (btnClass && btnClass.includes('absolute') && btnClass.includes('right')) {
        await btn.click();
        break;
      }
    }
    // After toggle, type should change to "text"
    const inputs = await driver.findElements(By.css('input'));
    const inputType = await inputs[1].getAttribute('type');
    assert.strictEqual(inputType, 'text', 'Password field should become visible after toggle');
  });

  it('TC-15: Demo credentials hint is shown on Login page', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Demo Credentials', 5000);
    await assertTextExists(driver, 'Demo Credentials');
    await assertTextExists(driver, 'alex@university.edu');
  });

  // ─── Forgot Password ────────────────────────────────────────────────────────

  it('TC-16: Forgot Password link navigates to Forgot Password screen', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await clickByText(driver, 'Forgot password?');
    await waitForText(driver, 'Forgot Password', 5000);
    await assertTextExists(driver, 'Forgot Password');
  });

  it('TC-17: Send Reset Link on Forgot Password screen triggers success flow', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Student Login');
    await waitForText(driver, 'Welcome Back', 5000);
    await clickByText(driver, 'Forgot password?');
    await waitForText(driver, 'Forgot Password', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('alex@university.edu');
    await clickButton(driver, 'Send Reset Link');
    await waitForText(driver, 'Reset link sent', 5000);
    await assertTextExists(driver, 'Reset link sent');
  });

  // ─── Student Registration ───────────────────────────────────────────────────

  it('TC-18: Register screen renders with Student role selected by default', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    await assertTextExists(driver, 'Create Account');
    await assertTextExists(driver, 'Student');
  });

  it('TC-19: Register fails when required fields are empty', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Please fill all required fields', 5000);
    await assertTextExists(driver, 'Please fill all required fields');
  });

  it('TC-20: Register fails when passwords do not match', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);

    const inputs = await driver.findElements(By.css('input'));
    // name, email, phone, studentId, password, confirm
    await inputs[0].sendKeys('Test Student');
    await inputs[1].sendKeys(`testuser${Date.now()}@university.edu`);
    await inputs[2].sendKeys('+91 99999 99999');
    await inputs[3].sendKeys('STU999');
    await inputs[4].sendKeys('password123');
    await inputs[5].sendKeys('different456');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Passwords do not match', 5000);
    await assertTextExists(driver, 'Passwords do not match');
  });

  it('TC-21: Register fails when password is less than 6 characters', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('Test Student');
    await inputs[1].sendKeys(`testshort${Date.now()}@university.edu`);
    await inputs[2].sendKeys('+91 88888 88888');
    await inputs[3].sendKeys('STU998');
    await inputs[4].sendKeys('abc');
    await inputs[5].sendKeys('abc');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'at least 6 characters', 5000);
    await assertTextExists(driver, 'at least 6 characters');
  });

  it('TC-21b: Register fails when password lacks letters or numbers', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('Test Student');
    await inputs[1].sendKeys(`testcomplexity${Date.now()}@university.edu`);
    await inputs[2].sendKeys('+91 88888 88888');
    await inputs[3].sendKeys('STU998');
    await inputs[4].sendKeys('onlyletters');
    await inputs[5].sendKeys('onlyletters');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'both letters and numbers', 5000);
    await assertTextExists(driver, 'both letters and numbers');
  });

  it('TC-22: Successful student registration redirects to Login', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);

    const inputs = await driver.findElements(By.css('input'));
    const unique = Date.now();
    await inputs[0].sendKeys('New Student');
    await inputs[1].sendKeys(`newstudent${unique}@university.edu`);
    await inputs[2].sendKeys('+91 77777 77777');
    await inputs[3].sendKeys(`STU${unique}`);
    await inputs[4].sendKeys('securePass1');
    await inputs[5].sendKeys('securePass1');
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Account created', 8000);
    await assertTextExists(driver, 'Account created');
  });

  it('TC-23: Register - Switching to Admin tab shows Admin Access Key field', async () => {
    await skipToWelcome(driver);
    await clickButton(driver, 'Create Student Account');
    await waitForText(driver, 'Create Account', 5000);
    await clickButton(driver, 'Admin');
    await waitForText(driver, 'Admin Access Key', 5000);
    await assertTextExists(driver, 'Admin Access Key');
  });

  // ─── Admin Login ────────────────────────────────────────────────────────────

  it('TC-24: Admin Login page renders correctly', async () => {
    await skipToWelcome(driver);
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);
    await assertTextExists(driver, 'Admin Login');
    await assertTextExists(driver, 'Administrator access');
  });

  it('TC-25: Admin Login fails with student credentials', async () => {
    await skipToWelcome(driver);
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('alex@university.edu');
    await inputs[1].sendKeys('123456');
    await clickButton(driver, 'Admin Sign In');
    await waitForText(driver, 'Invalid admin credentials', 5000);
    await assertTextExists(driver, 'Invalid admin credentials');
  });

  it('TC-26: Admin Login succeeds with valid admin credentials', async () => {
    await skipToWelcome(driver);
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);

    const inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('admin@university.edu');
    await inputs[1].sendKeys('admin123');
    await clickButton(driver, 'Admin Sign In');
    await waitForText(driver, 'Admin', 8000);
    // Verify admin dashboard loaded
    const pageText = await driver.findElement(By.css('body')).then(e => e.getText());
    assert.ok(
      pageText.includes('Admin') && (pageText.includes('Dashboard') || pageText.includes('Parcel')),
      'Admin dashboard should load after successful admin login'
    );
  });

  it('TC-27: Admin Login shows Demo credentials hint', async () => {
    await skipToWelcome(driver);
    await clickByText(driver, 'Admin Access');
    await waitForText(driver, 'Admin Login', 5000);
    await assertTextExists(driver, 'admin@university.edu');
  });
});
