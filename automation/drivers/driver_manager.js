'use strict';

const { remote } = require('webdriverio');
const config = require('../config/appium.config');

class DriverManager {
  constructor() {
    this.driver = null;
    this.isConnected = false;
  }

  async initDriver() {
    try {
      this.driver = await remote({
        hostname: config.server.host,
        port: config.server.port,
        path: config.server.path,
        capabilities: config.capabilities,
        logLevel: 'warn',
        connectionRetryTimeout: 15000,
        connectionRetryCount: 1
      });
      this.isConnected = true;
      console.log('✅ Driver Manager: Appium WebDriver session initialized successfully');
      return this.driver;
    } catch (err) {
      console.log(`⚠️ Driver Manager: Appium server not running at ${config.server.host}:${config.server.port}`);
      this.isConnected = false;
      return null;
    }
  }

  async switchToWebView(retries = 3) {
    if (!this.driver || !this.isConnected) return false;
    for (let i = 0; i < retries; i++) {
      try {
        await this.driver.pause(1500);
        const contexts = await this.driver.getContexts();
        const webCtx = contexts.find(c => c.toString().startsWith('WEBVIEW'));
        if (webCtx) {
          await this.driver.switchContext(webCtx.toString());
          console.log(`  ✓ Driver Manager: Switched to WebView context [${webCtx}]`);
          return true;
        }
      } catch (_e) {}
    }
    return false;
  }

  async switchToNative() {
    if (this.driver && this.isConnected) {
      try {
        await this.driver.switchContext('NATIVE_APP');
      } catch (_e) {}
    }
  }

  async quitDriver() {
    if (this.driver) {
      try {
        await this.driver.deleteSession();
        console.log('🛑 Driver Manager: Session closed');
      } catch (_e) {}
      this.driver = null;
      this.isConnected = false;
    }
  }
}

module.exports = new DriverManager();
