/**
 * Manager Library - Export Utility
 * Generates CSV and JSON reports from library loan data.
 */

const fs = require('fs');
const path = require('path');

function exportToCsv(data, filename) {
  if (!data || !data.length) {
    console.log('No data to export.');
    return;
  }
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(','));
  const csvContent = [headers, ...rows].join('\n');
  const outPath = path.join(__dirname, filename);
  fs.writeFileSync(outPath, csvContent, 'utf8');
  console.log(`✅ Exported ${data.length} records to ${filename}`);
}

function exportToJson(data, filename) {
  const outPath = path.join(__dirname, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Exported ${data.length} records to ${filename}`);
}

module.exports = { exportToCsv, exportToJson };
