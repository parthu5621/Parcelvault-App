'use strict';

const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://parthu5621.github.io/Parcelvault-App/';

module.exports = {
  baseUrl: BASE_URL,
  headless: process.env.HEADLESS !== 'false',
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  },
  reports: {
    excelDir: path.resolve(__dirname, '../reports/Excel'),
    htmlDir: path.resolve(__dirname, '../reports/HTML'),
    jsonDir: path.resolve(__dirname, '../reports/JSON'),
    summaryDir: path.resolve(__dirname, '../reports/Summary'),
    screenshotsDir: path.resolve(__dirname, '../screenshots'),
    logsDir: path.resolve(__dirname, '../logs')
  }
};
