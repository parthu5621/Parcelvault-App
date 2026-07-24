'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config/appium.config');

class Logger {
  constructor() {
    this.logDir = config.reports.logsDir;
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFile = path.join(this.logDir, `execution_${Date.now()}.log`);
  }

  log(msg, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
    console.log(formatted);
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  info(msg) { this.log(msg, 'INFO'); }
  warn(msg) { this.log(msg, 'WARN'); }
  error(msg) { this.log(msg, 'ERROR'); }
  step(num, desc) { this.log(`▶ STEP ${num}: ${desc}`, 'STEP'); }
}

module.exports = new Logger();
