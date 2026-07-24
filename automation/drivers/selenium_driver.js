'use strict';

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/selenium.config');

class SeleniumDriverManager {
  constructor() {
    this.driver = null;
  }

  async buildDriver() {
    try {
      const options = new chrome.Options();
      options.addArguments('--headless=new');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1440,900');

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      await this.driver.manage().setTimeouts(config.timeouts);
      console.log('✅ Selenium Driver initialized (Headless Chrome)');
      return this.driver;
    } catch (err) {
      console.log(`⚠️ Driver Initialization Notice: ${err.message}`);
      return null;
    }
  }

  async quitDriver() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (_e) {}
      this.driver = null;
    }
  }
}

module.exports = new SeleniumDriverManager();
