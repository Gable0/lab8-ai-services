import {defineConfig} from '@playwright/test';
import { trace } from 'console';
import { url } from 'inspector';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    use: {
        headless: true,
        baseURL: 'http://localhost:5500',
        viewport: {width: 1280, height: 720},
        trace: 'retain-on-failure'
    },
    
    webServer: {
        command: 'npx serve ./src -l 5500',
        url: 'http://localhost:5500',
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
