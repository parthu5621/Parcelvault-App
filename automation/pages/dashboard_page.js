'use strict';

const BasePage = require('./base_page');

class DashboardPage extends BasePage {
  get addParcelBtn() { return '#add-parcel-btn'; }
  get assignLockerBtn() { return '#assign-locker-btn'; }
  get verifyIssueBtn() { return '#verify-issue-btn'; }
  get userMgmtBtn() { return '#user-mgmt-btn'; }
  get logoutBtn() { return '#logout-button'; }

  async navigateToAddParcel() {
    await this.click(this.addParcelBtn);
  }

  async navigateToVerifyIssue() {
    await this.click(this.verifyIssueBtn);
  }

  async navigateToUserManagement() {
    await this.click(this.userMgmtBtn);
  }
}

module.exports = DashboardPage;
