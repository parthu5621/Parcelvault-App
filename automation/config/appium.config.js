'use strict';

const path = require('path');

const APPIUM_HOST = process.env.APPIUM_HOST || '127.0.0.1';
const APPIUM_PORT = parseInt(process.env.APPIUM_PORT || '4723');
const DEVICE_NAME = process.env.DEVICE_NAME || 'emulator-5554';
const PLATFORM_VERSION = process.env.PLATFORM_VERSION || '13.0';
const APP_PATH = process.env.APP_PATH || path.resolve(__dirname, '../../android-app/app/build/outputs/apk/debug/app-debug.apk');

module.exports = {
  server: {
    host: APPIUM_HOST,
    port: APPIUM_PORT,
    path: '/'
  },
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': DEVICE_NAME,
    'appium:platformVersion': PLATFORM_VERSION,
    'appium:app': APP_PATH,
    'appium:appPackage': 'com.example.parcelvaultapp',
    'appium:appActivity': 'com.example.parcelvaultapp.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:noReset': false,
    'appium:newCommandTimeout': 180,
    'appium:chromeOptions': {
      args: ['--disable-web-security']
    }
  },
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  },
  reports: {
    outputDir: path.resolve(__dirname, '../reports'),
    screenshotsDir: path.resolve(__dirname, '../screenshots'),
    logsDir: path.resolve(__dirname, '../logs'),
    historyDir: path.resolve(__dirname, '../reports/history')
  }
};
