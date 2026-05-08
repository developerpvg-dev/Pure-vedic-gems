/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

module.exports = {
  testDir: path.resolve(__dirname, '../.copilot-temp'),
  testMatch: ['validate-homepage.spec.js'],
  timeout: 180000,
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
};