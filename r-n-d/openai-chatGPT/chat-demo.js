'use strict';

require('dotenv').config();

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Set OPENAI_API_KEY in your environment before running this demo.');
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: 'In one sentence, explain how OpenAI trial credits (if any) affect planning automated chatbot tests.'
      }
    ]
  });

  const content = response?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((item) => (typeof item === 'string' ? item : item?.text || '')).join('').trim()
    : (content || '').trim();

  console.log('OpenAI response:\n', text || '[empty response]');
}

run().catch((error) => {
  console.error('OpenAI demo failed:', error.message);
});
