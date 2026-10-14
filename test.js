/**
 * CLI Tool Smoke Tests
 */
const assert = require('assert');
const { exportToCsv, exportToJson } = require('./exporter');
const fs = require('fs');
const path = require('path');

console.log('Testing CLI Tool Exporter...');
const sample = [{ id: 1, title: 'Clean Code', loans: 5 }];
exportToJson(sample, 'test-output.json');
assert(fs.existsSync(path.join(__dirname, 'test-output.json')));
fs.unlinkSync(path.join(__dirname, 'test-output.json'));

console.log('✓ CLI Tool Exporter tests passed successfully!');
