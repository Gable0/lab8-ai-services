# Anthropic vs OpenAI Free-Access Evaluation

The assignment requires choosing a hosted LLM that can be exercised without incurring surprise costs. I focused on Anthropic Claude and OpenAI—two services specifically requested—cataloging what each currently offers in terms of free tiers, trial credits, and practical limitations (information verified during Fall 2024).

## Evaluation Criteria
- **Free allocation** – How much usage is available before billing starts.
- **Activation requirements** – Steps or approvals needed to unlock the trial.
- **Usage constraints** – Rate limits, model access, or geographic restrictions.
- **Integration impact** – How the plan affects local development, Playwright tests, and API key hygiene.

## Anthropic Claude
- **Free allocation**: New API keys typically include \$5–\$10 of promotional credit that lasts ~90 days. This covers dozens of requests using `claude-3-haiku` or a handful of `claude-3-sonnet`.
- **Activation requirements**: Account signup, phone verification, and a short wait (often <24h) for approval. No credit card is required for the initial credit.
- **Usage constraints**: Throughput is limited until the account demonstrates consistent usage. Some countries are not yet supported.
- **Integration impact**: Works well for lightweight experimentation. Keep automated tests mocked to avoid draining the limited credit. Store the key as `ANTHROPIC_API_KEY` inside `.env` (already ignored by `.gitignore`). Supports server-side streaming and tool use, which fits the `AIService` abstraction.

## OpenAI
- **Free allocation**: As of mid-2024, standard API accounts do **not** ship with automatic free credit. Promotional credits occasionally appear via education programs, but they are uncommon and typically expire in 30 days.
- **Activation requirements**: Must add billing details (credit card or approved sponsor) before most models, including GPT-4o, can be called. Identity verification may be required in certain regions.
- **Usage constraints**: New accounts face tight rate limits (requests per minute and tokens per minute). Usage stops immediately if the account has no balance or credit.
- **Integration impact**: Without credits, you cannot run live calls. The safest approach is to rely on mock responses during automated tests and only run the `openai-sandbox` script after confirming promotional credits. Store the key as `OPENAI_API_KEY` and never commit it.

## Summary & Recommendation
| Provider | Free Access | Setup Overhead | Notes |
|----------|-------------|----------------|-------|
| Anthropic Claude | \$5–\$10 promotional credit, ~90 day window | Phone verification + approval | Enough for initial integration tests if you avoid large contexts. |
| OpenAI | No default credit; occasional \$5 promotions | Requires billing details to unlock most models | Plan on mocking responses unless your account already has sponsor credit. |

Given the current offerings, **Anthropic** is the practical choice.

## Execution Plan
1. Use the `r-n-d/anthropic-sandbox` script to verify free credit and capture sample responses for mocking.
2. Configure `AIService` to support provider swapping via environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).
3. For OpenAI, run the sandbox script only when credits are confirmed; otherwise, record a fixture from an existing call and reuse it during tests.
4. Extend Playwright tests to intercept outbound requests and supply the saved fixture, preventing accidental spend from either provider.
