// tests/chat.spec.js
import { test, expect } from '@playwright/test';

async function sendMessage(page, message) { 
    await page.fill('#user-input', message); 
    await page.click('#send-btn'); 
}

test.describe('Chat assistant', () => { 
    test.beforeEach(async ({ page }) => {
    await page.goto('/');
    });

    test('Eliza mode replies to a greeting', async ({ page }) => {
    // Ensure we are on Eliza mode (default) and the chat starts empty
    await expect(page.locator('#message-container li')).toHaveCount(0);

    await sendMessage(page, 'hello there');

    // Wait for both user and bot messages to appear
    await expect(page.locator('#message-container li')).toHaveCount(2);

    const userBubble = page.locator('#message-container li').nth(0);
    const botBubble = page.locator('#message-container li').nth(1);

    await expect(userBubble).toHaveClass(/user-message/);
    await expect(botBubble).toHaveClass(/bot-output/);

    // Eliza picks from a response list; just assert we got non-empty text
    const botText = (await botBubble.textContent())?.trim();
    expect(botText?.length).toBeGreaterThan(0);
    });

    test('ChatGPT mode uses LLM endpoint (mocked)', async ({ page }) => {
    // Fake the internet request before changing chat modes
    await page.route('**/api/chatgpt', async (route) => {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Mocked LLM response.' })
        });
    });

    await page.selectOption('#bot-mode-select', 'chatgpt');

    await sendMessage(page, 'Summarize MVC');

    // Expect user message and placeholder once “thinking” bubble appears
    const messages = page.locator('#message-container li');
    await expect(messages).toHaveCount(2);

    // The second message should eventually update with our mocked reply
    await expect(messages.nth(1)).toContainText('Mocked LLM response.');
    });
});
