'use strict';

const http = require('http');
const { performance } = require('perf_hooks');

const TARGET_HOST = 'localhost';
const TARGET_PORT = 3001;
const CONCURRENT_USERS = 100;
const DURATION_SECONDS = 60;

let adminToken = '';
let studentToken = '';

async function makeRequest(options, postData = null) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        statusCode: 0,
        duration,
        success: false,
        error: err.message
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function authenticateTokens() {
  console.log('🔑 Authenticating load test Virtual Users...');
  
  // Login Admin
  const adminPostData = JSON.stringify({ email: 'admin@university.edu', password: 'admin123', role: 'admin' });
  const adminRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminPostData) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(adminPostData);
    req.end();
  });

  if (adminRes.token) adminToken = adminRes.token;

  // Login Student
  const studentPostData = JSON.stringify({ email: 'alex@university.edu', password: '123456', role: 'student' });
  const studentRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(studentPostData) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(studentPostData);
    req.end();
  });

  if (studentRes.token) studentToken = studentRes.token;

  console.log(`✅ Authentication Tokens Acquired (Admin & Student)\n`);
}

async function runBaselineLoadTest() {
  await authenticateTokens();

  console.log(`=======================================================`);
  console.log(`🚀 STARTING BASELINE LOAD TEST`);
  console.log(`=======================================================`);
  console.log(`• Concurrent Virtual Users (VUs): ${CONCURRENT_USERS}`);
  console.log(`• Test Duration:                 ${DURATION_SECONDS} seconds (1 minute)`);
  console.log(`• Target Host:                   http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`=======================================================\n`);

  const results = [];
  const endpointStats = {
    '/api/parcels': { count: 0, sumTime: 0, errors: 0 },
    '/api/lockers': { count: 0, sumTime: 0, errors: 0 },
    '/api/dashboard/stats': { count: 0, sumTime: 0, errors: 0 },
    '/api/auth/login': { count: 0, sumTime: 0, errors: 0 }
  };

  let stopTest = false;
  const testStartTime = performance.now();

  setTimeout(() => {
    stopTest = true;
  }, DURATION_SECONDS * 1000);

  // Worker loop for 1 Virtual User
  async function virtualUserWorker(vuId) {
    const endpoints = [
      { path: '/api/parcels', method: 'GET', token: studentToken },
      { path: '/api/lockers', method: 'GET', token: adminToken },
      { path: '/api/dashboard/stats', method: 'GET', token: adminToken },
      { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'alex@university.edu', password: '123456' }) }
    ];

    let requestIdx = 0;

    while (!stopTest) {
      const ep = endpoints[requestIdx % endpoints.length];
      requestIdx++;

      const headers = {};
      let postData = null;

      if (ep.token) {
        headers['Authorization'] = `Bearer ${ep.token}`;
      }
      if (ep.body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(ep.body);
        postData = ep.body;
      }

      const res = await makeRequest({
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: ep.path,
        method: ep.method,
        headers
      }, postData);

      results.push({ duration: res.duration, success: res.success, path: ep.path });

      if (endpointStats[ep.path]) {
        endpointStats[ep.path].count++;
        endpointStats[ep.path].sumTime += res.duration;
        if (!res.success) endpointStats[ep.path].errors++;
      }
    }
  }

  // Launch 100 concurrent Virtual Users
  const workers = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    workers.push(virtualUserWorker(i));
  }

  // Print progress every 10 seconds
  const progressInterval = setInterval(() => {
    const elapsed = Math.round((performance.now() - testStartTime) / 1000);
    console.log(`⏳ Progress: ${elapsed}s / ${DURATION_SECONDS}s completed | Total Requests: ${results.length}`);
  }, 10000);

  await Promise.all(workers);
  clearInterval(progressInterval);

  const totalDurationMs = performance.now() - testStartTime;
  const totalDurationSec = totalDurationMs / 1000;

  // Calculate Metrics
  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const rps = (totalRequests / totalDurationSec).toFixed(2);

  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const minTime = durations[0] ? durations[0].toFixed(2) : 0;
  const maxTime = durations[durations.length - 1] ? durations[durations.length - 1].toFixed(2) : 0;
  const avgTime = (durations.reduce((a, b) => a + b, 0) / (durations.length || 1)).toFixed(2);

  const p50 = durations[Math.floor(durations.length * 0.50)]?.toFixed(2) || 0;
  const p90 = durations[Math.floor(durations.length * 0.90)]?.toFixed(2) || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)]?.toFixed(2) || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)]?.toFixed(2) || 0;

  console.log(`\n=======================================================`);
  console.log(`📊 BASELINE LOAD TEST RESULTS SUMMARY`);
  console.log(`=======================================================`);
  console.log(`• Total Execution Time:         ${totalDurationSec.toFixed(2)}s`);
  console.log(`• Virtual Users (VUs):           ${CONCURRENT_USERS}`);
  console.log(`• Total Requests Sent:           ${totalRequests}`);
  console.log(`• Successful Requests:           ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(2)}%)`);
  console.log(`• Failed Requests:               ${failedRequests} (${((failedRequests/totalRequests)*100).toFixed(2)}%)`);
  console.log(`-------------------------------------------------------`);
  console.log(`⚡ REQUESTS PER SECOND (RPS):     ${rps} req/sec`);
  console.log(`-------------------------------------------------------`);
  console.log(`⏱️ RESPONSE TIMES:`);
  console.log(`  • Minimum (Fastest):           ${minTime} ms`);
  console.log(`  • Average:                     ${avgTime} ms`);
  console.log(`  • 50th Percentile (Median P50): ${p50} ms`);
  console.log(`  • 90th Percentile (P90):        ${p90} ms`);
  console.log(`  • 95th Percentile (P95):        ${p95} ms`);
  console.log(`  • 99th Percentile (P99):        ${p99} ms`);
  console.log(`  • Maximum (Slowest):           ${maxTime} ms`);
  console.log(`=======================================================\n`);

  console.log(`📋 ENDPOINT BREAKDOWN:`);
  console.table(
    Object.keys(endpointStats).map(ep => ({
      Endpoint: ep,
      'Total Requests': endpointStats[ep].count,
      'Avg Response Time (ms)': (endpointStats[ep].sumTime / (endpointStats[ep].count || 1)).toFixed(2),
      'Errors': endpointStats[ep].errors
    }))
  );
}

runBaselineLoadTest().catch(console.error);
