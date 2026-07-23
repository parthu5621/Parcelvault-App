const autocannon = require('autocannon');
const ExcelJS = require('exceljs');

const url = process.argv[2];

if (!url) {
  console.error('Please provide a URL to test.');
  console.error('Usage: node load-test.js <URL>');
  process.exit(1);
}

console.log(`Starting load test for ${url}`);
console.log(`Simulating 100 virtual users for 1 minute...\n`);

const instance = autocannon({
  url: url,
  connections: 100, // 100 virtual users
  duration: 60,     // 1 minute
}, async (err, result) => {
  if (err) {
    console.error('Error during load test:', err);
    return;
  }

  const rps = result.requests.average;
  const latencyMin = result.latency.min;
  const latencyMax = result.latency.max;
  const latencyAvg = result.latency.average;

  console.log('\n--- Load Test Results ---');
  console.log(`Requests per second (RPS)`);
  console.log(`${Math.round(rps)} req/sec`);
  console.log(`Meaning your API is handling about ${Math.round(rps)} requests every second.\n`);
  
  console.log(`Response Time`);
  console.log(`Average: ${latencyAvg}ms`);
  console.log(`Min: ${latencyMin}ms`);
  console.log(`Max: ${latencyMax}ms`);
  
  console.log(`\nMeaning:`);
  console.log(`• Fastest response = ${latencyMin}ms`);
  console.log(`• Average = ${latencyAvg}ms`);
  console.log(`• Slowest = ${latencyMax}ms`);

  // Generate Excel sheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');

  // Add Headers
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Unit', key: 'unit', width: 15 }
  ];

  // Add Data
  sheet.addRow({ metric: 'Target URL', value: url, unit: '' });
  sheet.addRow({ metric: 'Concurrent Users', value: 100, unit: '' });
  sheet.addRow({ metric: 'Duration', value: 60, unit: 'seconds' });
  sheet.addRow({ metric: 'Total Requests Sent', value: result.requests.total, unit: '' });
  sheet.addRow({ metric: 'Requests per second (RPS)', value: Math.round(rps), unit: 'req/sec' });
  sheet.addRow({ metric: 'Min Response Time', value: latencyMin, unit: 'ms' });
  sheet.addRow({ metric: 'Max Response Time', value: latencyMax, unit: 'ms' });
  sheet.addRow({ metric: 'Avg Response Time', value: latencyAvg, unit: 'ms' });
  sheet.addRow({ metric: 'Total Errors', value: result.errors, unit: '' });
  sheet.addRow({ metric: 'Timeouts', value: result.timeouts, unit: '' });

  // Format header row
  sheet.getRow(1).font = { bold: true, size: 12 };
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `load_test_results_${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(filename);
  console.log(`\n✅ Results successfully saved to ${filename}`);
});

// Show progress bar in console
autocannon.track(instance, { renderProgressBar: true });
