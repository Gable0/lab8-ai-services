import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    use: {
        headless: true,
        baseURL: "http://127.0.0.1:4173",
        viewport: { width: 1280, height: 720 },
        trace: "retain-on-failure"
    },
    webServer: {
        command: "npx http-server ./src -p 4173 -c-1",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe"
    }
});
