'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Helper to parse CSV manually (handles commas inside quotes)
function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  const result = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    result.push(row);
  }
  return result;
}

function convertCSVToXLSX(csvPath, xlsxPath, sheetName) {
  console.log(`Reading ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const data = parseCSV(csvContent);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  console.log(`Writing ${xlsxPath}...`);
  XLSX.writeFile(wb, xlsxPath);
  console.log(`Successfully generated ${xlsxPath}`);
}

const rootDir = path.dirname(__dirname);

// Convert Web Selenium Test Cases
const webCsv = path.join(rootDir, 'selenium-tests', 'selenium_100_web_test_cases.csv');
const webXlsx = path.join(rootDir, 'selenium-tests', 'selenium_100_web_test_cases.xlsx');
convertCSVToXLSX(webCsv, webXlsx, 'Web Selenium Tests');

// Convert Appium Android Test Cases
const androidCsv = path.join(rootDir, 'android-tests', 'appium_android_test_cases.csv');
const androidXlsx = path.join(rootDir, 'android-tests', 'appium_android_test_cases.xlsx');
convertCSVToXLSX(androidCsv, androidXlsx, 'Appium Android Tests');

console.log('Done!');
