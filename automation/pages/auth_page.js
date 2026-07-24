'use strict';

const BasePage = require('./base_page');

class AuthPage extends BasePage {
  // Locators
  get loginBtn() { return '#student-login-btn'; }
  get registerBtn() { return '#create-account-btn'; }
  get adminAccessBtn() { return '#admin-access-btn'; }
  get emailInput() { return 'input[type="email"]'; }
  get passwordInput() { return 'input[type="password"]'; }
  get submitLoginBtn() { return '#login-button'; }
  get submitRegisterBtn() { return '#register-button'; }
  get submitAdminLoginBtn() { return '#admin-login-button'; }

  async loginStudent(email, password) {
    await this.click(this.loginBtn);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitLoginBtn);
  }

  async loginAdmin(email, password) {
    await this.click(this.adminAccessBtn);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitAdminLoginBtn);
  }
}

module.exports = AuthPage;
