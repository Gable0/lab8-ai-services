import { getBotResponse } from "./eliza.js";

const DEFAULT_ENDPOINT = typeof window !== "undefined" && window.CHAT_GPT_ENDPOINT
    ? window.CHAT_GPT_ENDPOINT
    : "/api/chatgpt";

/**
 * Service layer that abstracts chat responses for different bot modes.
 */
export class AIService {
    /**
     * @param {{ endpoint?: string }} [config]
     */
    constructor(config = {}) {
        this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
    }

    /**
     * Generate a response using the Eliza keyword matcher.
     * @param {string} message
     * @returns {string}
     */
    getElizaReply(message) {
        return getBotResponse(message);
    }

    /**
     * Request a ChatGPT style response from the configured endpoint.
     * @param {string} message
     * @param {{ signal?: AbortSignal }} [options]
     * @returns {Promise<string>}
     */
    async getChatGPTReply(message, { signal } = {}) {
        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
            signal
        });

        if (!response.ok) {
            throw new Error(`ChatGPT request failed with status ${response.status}`);
        }

        const data = await response.json();
        const text =
            this.extractText(data, ["reply", "text", "content", "message"]) ||
            this.extractFromChoices(data) ||
            "";

        return (text || "I don't have a response right now. Please try again later.").trim();
    }

    /**
     * Pull a string value from common response shapes.
     * @param {unknown} source
     * @param {string[]} keys
     * @returns {string}
     */
    extractText(source, keys) {
        if (!source || typeof source !== "object") return "";
        for (const key of keys) {
            const value = source[key];
            if (typeof value === "string" && value.trim() !== "") {
                return value;
            }
        }
        return "";
    }

    /**
     * Handle OpenAI style payloads that include a choices array.
     * @param {unknown} data
     * @returns {string}
     */
    extractFromChoices(data) {
        if (!data || !Array.isArray(data.choices) || data.choices.length === 0) {
            return "";
        }

        const [choice] = data.choices;
        if (typeof choice === "string") {
            return choice;
        }

        if (choice && typeof choice === "object") {
            if (typeof choice.text === "string") {
                return choice.text;
            }

            const message = choice.message || {};
            if (typeof message.content === "string") {
                return message.content;
            }
        }

        return "";
    }
}
