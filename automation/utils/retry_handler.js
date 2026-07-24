'use strict';

class RetryHandler {
  static async executeWithRetry(fn, maxRetries = 2, delayMs = 1000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt <= maxRetries) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    throw lastError;
  }
}

module.exports = RetryHandler;
