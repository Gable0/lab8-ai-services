import { getBotResponse } from "./eliza.js";

export class SimpleChatController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.pendingBotTimers = new Map();
        this.pendingLLMRequests = new Map();

        this.botReplyDelayMs = 250;
        this.mode = "eliza";

        this.boundSend = (evt) => this.onSendMessage(evt);
        this.boundClear = () => this.onClearChat();
        this.boundDelete = (evt) => this.onDeleteMessage(evt);
        this.boundEdit = (evt) => this.onEditMessage(evt);
        this.boundExport = () => this.onExportChat();
        this.boundImport = (evt) => this.onImportChat(evt);
        this.boundModelChange = (evt) => this.onModelChange(evt);
        this.boundModeChange = (evt) => this.onModeChange(evt);
    }

    init(containerSelector = "#app") {
        this.view.render(containerSelector);
        this.registerViewEvents();
        this.model.addEventListener("change", this.boundModelChange);
        this.syncViewWithModel();
    }

    registerViewEvents() {
        this.view.addEventListener("sendMessage", this.boundSend);
        this.view.addEventListener("clearChat", this.boundClear);
        this.view.addEventListener("deleteMessage", this.boundDelete);
        this.view.addEventListener("editMessage", this.boundEdit);
        this.view.addEventListener("exportChat", this.boundExport);
        this.view.addEventListener("importChat", this.boundImport);
        this.view.addEventListener("modeChange", this.boundModeChange);
    }

    onModelChange(evt) {
        const { messages, stats } = evt.detail;
        this.view.renderMessages(messages);
        this.view.updateStats(stats);
    }

    onModeChange(evt) {
        const { mode } = evt.detail || {};
        if (!mode || mode === this.mode) return;

        this.mode = mode;
        this.cancelAllBotTimers();
        this.abortAllLLMRequests();
    }

    syncViewWithModel() {
        this.view.renderMessages(this.model.getAllMessages());
        this.view.updateStats(this.model.getStats());
    }

    onSendMessage(evt) {
        const { message, isUser } = evt.detail;
        if (!message) return;

        const entry = this.model.addMessage(message, isUser);

        if (!isUser) return;

        if (this.mode === "chatgpt") {
            this.queueChatGPTReply(entry);
            return;
        }

        this.queueElizaReply(entry);
    }

    onClearChat() {
        const removed = this.model.clearMessages();
        removed
            .filter((message) => message.isUser)
            .forEach((message) => {
                this.cancelBotTimer(message.id);
                this.abortLLMRequest(message.id);
            });
        this.cancelAllBotTimers();
        this.abortAllLLMRequests();
    }

    onDeleteMessage(evt) {
        const { messageId } = evt.detail;
        if (!messageId) return;

        const removed = this.model.removeMessage(messageId);
        if (!Array.isArray(removed) || removed.length === 0) return;

        removed
            .filter((message) => message.isUser)
            .forEach((message) => {
                this.cancelBotTimer(message.id);
                this.abortLLMRequest(message.id);
            });
    }

    onEditMessage(evt) {
        const { messageId, newText } = evt.detail;
        const trimmed = newText ? newText.trim() : "";
        if (!messageId || !trimmed) return;

        const { updatedMessage, nextBotMessage } = this.model.updateUserMessage(messageId, trimmed);
        if (!updatedMessage) return;

        this.cancelBotTimer(messageId);
        const abortedRequest = this.abortLLMRequest(messageId);

        if (this.mode === "chatgpt") {
            const placeholderId = nextBotMessage?.id || abortedRequest?.botMessageId || null;
            this.queueChatGPTReply(updatedMessage, { placeholderId });
            return;
        }

        if (nextBotMessage) {
            const reply = getBotResponse(trimmed);
            this.model.updateMessageContent(nextBotMessage.id, reply, { markEdited: true });
        } else {
            this.queueElizaReply(updatedMessage);
        }
    }

    onExportChat() {
        const payload = this.model.exportMessages();
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `chat-export-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    onImportChat(evt) {
        const { importedData } = evt.detail;
        if (!importedData) return;

        try {
            const payload = Array.isArray(importedData) ? importedData : importedData.messages;
            if (!Array.isArray(payload)) {
                throw new Error("Invalid chat format");
            }

            this.model.importMessages(payload);
            this.cancelAllBotTimers();
            this.abortAllLLMRequests();
        } catch (err) {
            alert("Unable to import chat data.");
            console.error(err);
        }
    }

    queueElizaReply(userEntry) {
        const timerId = setTimeout(() => {
            const reply = getBotResponse(userEntry.message);
            this.model.addMessage(reply, false);
            this.pendingBotTimers.delete(userEntry.id);
        }, this.botReplyDelayMs);

        this.pendingBotTimers.set(userEntry.id, timerId);
    }

    queueChatGPTReply(userEntry, { placeholderId = null } = {}) {
        const controller = new AbortController();
        const thinkingLabel = "ChatGPT is thinking...";
        let botMessageId = placeholderId;

        if (botMessageId) {
            const existing = this.model.updateMessageContent(
                botMessageId,
                thinkingLabel,
                { markEdited: false }
            );

            if (!existing) {
                botMessageId = null;
            }
        }

        if (!botMessageId) {
            const placeholder = this.model.addMessage(thinkingLabel, false);
            botMessageId = placeholder.id;
        }

        this.pendingLLMRequests.set(userEntry.id, { controller, botMessageId });

        (async () => {
            try {
                const reply = await fetchChatGPTResponse(userEntry.message, { signal: controller.signal });
                this.model.updateMessageContent(botMessageId, reply, { markEdited: false });
            } catch (error) {
                const isAbort = controller.signal.aborted;
                const message = isAbort
                    ? "Request cancelled."
                    : "Sorry, ChatGPT is unavailable right now.";

                this.model.updateMessageContent(botMessageId, message, { markEdited: false });

                if (!isAbort) {
                    console.error("ChatGPT request failed:", error);
                }
            } finally {
                this.pendingLLMRequests.delete(userEntry.id);
            }
        })();
    }

    abortLLMRequest(messageId) {
        const record = this.pendingLLMRequests.get(messageId);
        if (!record) return null;

        record.controller.abort();
        this.pendingLLMRequests.delete(messageId);
        return record;
    }

    abortAllLLMRequests() {
        this.pendingLLMRequests.forEach((record) => record.controller.abort());
        this.pendingLLMRequests.clear();
    }

    cancelBotTimer(messageId) {
        const timerId = this.pendingBotTimers.get(messageId);
        if (!timerId) return;

        clearTimeout(timerId);
        this.pendingBotTimers.delete(messageId);
    }

    cancelAllBotTimers() {
        this.pendingBotTimers.forEach((timerId) => clearTimeout(timerId));
        this.pendingBotTimers.clear();
    }
}

async function fetchChatGPTResponse(message, { signal } = {}) {
    const endpoint = typeof window !== "undefined" && window.CHAT_GPT_ENDPOINT
        ? window.CHAT_GPT_ENDPOINT
        : "/api/chatgpt";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message }),
        signal
    });

    if (!response.ok) {
        throw new Error(`ChatGPT request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text =
        extractText(data, ["reply", "text", "content", "message"]) ||
        fallbackFromChoices(data) ||
        "";

    return (text || "I don't have a response right now. Please try again later.").trim();
}

function extractText(source, keys) {
    if (!source || typeof source !== "object") return "";

    for (const key of keys) {
        const value = source[key];
        if (typeof value === "string" && value.trim() !== "") {
            return value;
        }
    }

    return "";
}

function fallbackFromChoices(data) {
    if (!data || !Array.isArray(data.choices) || data.choices.length === 0) {
        return "";
    }

    const choice = data.choices[0];

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
