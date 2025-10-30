// tests/chat.spec.js
import { test, expect } from '@playwright/test';

/**
 * Helper to submit a message in the chat UI.
 * @param {import('@playwright/test').Page} page
 * @param {string} message
 */
async function sendMessage(page, message) {
    await page.fill("#user-input", message);
    await page.click("#send-btn");
}

test.describe("Chat assistant", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("Eliza mode replies to a greeting", async ({ page }) => {
        await expect(page.locator("#message-container li")).toHaveCount(0);

        await sendMessage(page, "hello there");

        await expect(page.locator("#message-container li")).toHaveCount(2);

        const userBubble = page.locator("#message-container li").nth(0);
        const botBubble = page.locator("#message-container li").nth(1);

        await expect(userBubble).toHaveClass(/user-message/);
        await expect(botBubble).toHaveClass(/bot-output/);

        const botText = (await botBubble.textContent())?.trim();
        expect(botText?.length).toBeGreaterThan(0);
    });

    test("ChatGPT mode uses LLM endpoint (mocked)", async ({ page }) => {
        await page.route("**/api/chatgpt", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ reply: "Mocked LLM response." })
            });
        });

        await page.selectOption("#bot-mode-select", "chatgpt");

        await sendMessage(page, "Summarize MVC");

        const messages = page.locator("#message-container li");
        await expect(messages).toHaveCount(2);

        await expect(messages.nth(1)).toContainText("Mocked LLM response.");
    });
});
