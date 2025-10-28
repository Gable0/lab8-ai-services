'use strict';

require('dotenv').config();

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set ANTHROPIC_API_KEY in your environment before running this demo.');
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: 'Describe one low-cost strategy for testing an Eliza-style chatbot end-to-end.'
      }
    ]
  });

  const text = response?.content?.[0]?.text?.trim();
  console.log('Claude response:\n', text || '[empty response]');
}

run().catch((error) => {
  console.error('Claude demo failed:', error.message);
});
