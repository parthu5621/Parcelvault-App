const ExcelJS = require('exceljs');

async function createDummyExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');

  // Add Headers
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Unit', key: 'unit', width: 15 }
  ];

  // Add Dummy Data
  sheet.addRow({ metric: 'Target URL', value: 'http://localhost:3000/example-api', unit: '' });
  sheet.addRow({ metric: 'Concurrent Users', value: 100, unit: '' });
  sheet.addRow({ metric: 'Duration', value: 60, unit: 'seconds' });
  sheet.addRow({ metric: 'Total Requests Sent', value: 7200, unit: '' });
  sheet.addRow({ metric: 'Requests per second (RPS)', value: 120, unit: 'req/sec' });
  sheet.addRow({ metric: 'Min Response Time', value: 50, unit: 'ms' });
  sheet.addRow({ metric: 'Max Response Time', value: 1500, unit: 'ms' });
  sheet.addRow({ metric: 'Avg Response Time', value: 250, unit: 'ms' });
  sheet.addRow({ metric: 'Total Errors', value: 0, unit: '' });
  sheet.addRow({ metric: 'Timeouts', value: 0, unit: '' });

  // Format header row
  sheet.getRow(1).font = { bold: true, size: 12 };

  await workbook.xlsx.writeFile('example_results.xlsx');
  console.log('Dummy Excel file generated successfully.');
}

createDummyExcel();
