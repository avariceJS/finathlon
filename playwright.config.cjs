const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:5178',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5178',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_KEY: 'visual-test' },
    timeout: 60000,
  },
})
