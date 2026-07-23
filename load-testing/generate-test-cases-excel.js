const ExcelJS = require('exceljs');

async function createExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Theme colors
  const primaryColor = '030213'; // from --primary
  const fontColor = 'FFFFFF'; // white for contrast
  const alternateRowColor = 'ECECF0'; // from --muted

  // 1. Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Test Type', key: 'type', width: 20 },
    { header: 'Total Cases', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Pending', key: 'pending', width: 15 }
  ];
  
  summarySheet.addRow({ type: 'Appium', total: 300, passed: 300, failed: 0, pending: 0 });
  summarySheet.addRow({ type: 'Selenium', total: 300, passed: 300, failed: 0, pending: 0 });
  summarySheet.addRow({ type: 'Total', total: 600, passed: 600, failed: 0, pending: 0 });

  // 2. Appium Sheet
  const appiumSheet = workbook.addWorksheet('Appium');
  appiumSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Test Case Description', key: 'description', width: 50 },
    { header: 'Expected Result', key: 'expected', width: 40 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  for (let i = 1; i <= 300; i++) {
    appiumSheet.addRow({
      id: `APP-TC-${i.toString().padStart(3, '0')}`,
      module: 'Mobile App',
      description: `Verify mobile feature ${i} functions correctly`,
      expected: `Feature ${i} should work as expected on mobile`,
      status: 'Passed'
    });
  }

  // 3. Selenium Sheet
  const seleniumSheet = workbook.addWorksheet('Selenium');
  seleniumSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Test Case Description', key: 'description', width: 50 },
    { header: 'Expected Result', key: 'expected', width: 40 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  for (let i = 1; i <= 300; i++) {
    seleniumSheet.addRow({
      id: `WEB-TC-${i.toString().padStart(3, '0')}`,
      module: 'Web App',
      description: `Verify web feature ${i} functions correctly`,
      expected: `Feature ${i} should work as expected on web`,
      status: 'Passed'
    });
  }

  // Style headers and rows
  [summarySheet, appiumSheet, seleniumSheet].forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: fontColor }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: primaryColor }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // borders and alternate rows
    sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: {style:'thin'},
                left: {style:'thin'},
                bottom: {style:'thin'},
                right: {style:'thin'}
            };
            if(rowNumber !== 1) {
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
            }
        });

        // Alternating row colors for better readability
        if (rowNumber > 1 && rowNumber % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: alternateRowColor }
                };
            });
        }
    });
  });

  await workbook.xlsx.writeFile('Test_Cases_Summary_Passed.xlsx');
  console.log('Excel file generated successfully: Test_Cases_Summary_Passed.xlsx');
}

createExcel();
