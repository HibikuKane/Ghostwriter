import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npx serve . --listen 3000 --no-clipboard',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 10000,
    },
    reporter: [['list'], ['html', { open: 'never' }]],
});
