'use strict';

class BasePage {
  constructor(driverManager) {
    this.driverManager = driverManager;
  }

  get driver() {
    return this.driverManager.driver;
  }

  async waitForElement(selector, timeout = 10000) {
    if (!this.driver) return null;
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async click(selector) {
    if (!this.driver) return;
    const el = await this.waitForElement(selector);
    if (el) await el.click();
  }

  async type(selector, text) {
    if (!this.driver) return;
    const el = await this.waitForElement(selector);
    if (el) {
      await el.clearValue();
      await el.setValue(text);
    }
  }

  async getText(selector) {
    if (!this.driver) return '';
    const el = await this.waitForElement(selector);
    return el ? await el.getText() : '';
  }
}

module.exports = BasePage;
