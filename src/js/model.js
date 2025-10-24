export class SimpleChatModel extends EventTarget {
    constructor(storageKey = "chatHistory") {
        super();
        this.storageKey = storageKey;
        const { messages, lastSavedAt } = this.readFromStorage();
        this.messages = messages;
        this.lastSavedAt = lastSavedAt;
    }

    getAllMessages() {
        return this.messages.map((msg) => ({
            ...msg,
            edited: Boolean(msg.edited),
            editedAt: msg.editedAt || null,
            timestamp: msg.timestamp || null
        }));
    }

    getStats() {
        return {
            count: this.messages.length,
            lastSavedAt: this.lastSavedAt || null
        };
    }

    addMessage(text, isUser) {
        const entry = {
            id: this.createId(),
            message: text,
            isUser: Boolean(isUser),
            timestamp: new Date().toISOString(),
            edited: false,
            editedAt: null
        };

        this.messages.push(entry);
        this.writeToStorage();
        this.emitChange("add");
        return entry;
    }

    updateUserMessage(messageId, newText) {
        const index = this.messages.findIndex((msg) => msg.id === messageId);
        if (index === -1) return { updatedMessage: null, nextBotMessage: null };

        const target = this.messages[index];
        if (!target.isUser) {
            return { updatedMessage: null, nextBotMessage: null };
        }

        target.message = newText;
        target.edited = true;
        target.editedAt = new Date().toISOString();

        let nextBotMessage = null;
        for (let i = index + 1; i < this.messages.length; i++) {
            const candidate = this.messages[i];
            if (candidate.isUser) break;
            nextBotMessage = candidate;
            break;
        }

        this.writeToStorage();
        this.emitChange("update-user");
        return {
            updatedMessage: { ...target },
            nextBotMessage: nextBotMessage ? { ...nextBotMessage } : null
        };
    }

    updateMessageContent(messageId, newText, { markEdited = true } = {}) {
        const index = this.messages.findIndex((msg) => msg.id === messageId);
        if (index === -1) return null;

        const target = this.messages[index];
        target.message = newText;

        if (markEdited) {
            target.edited = true;
            target.editedAt = new Date().toISOString();
        }

        this.writeToStorage();
        this.emitChange("update");
        return { ...target };
    }

    removeMessage(messageId) {
        const index = this.messages.findIndex((msg) => msg.id === messageId);
        if (index === -1) return [];

        const removed = this.messages.splice(index);
        this.writeToStorage();
        this.emitChange("remove");
        return removed.map((msg) => ({
            ...msg,
            edited: Boolean(msg.edited),
            editedAt: msg.editedAt || null,
            timestamp: msg.timestamp || null
        }));
    }

    clearMessages() {
        const removed = this.getAllMessages();
        this.messages = [];
        this.writeToStorage();
        this.emitChange("clear");
        return removed;
    }

    importMessages(payload = []) {
        if (!Array.isArray(payload)) {
            throw new Error("Imported chat must be an array");
        }

        this.messages = payload
            .filter((item) => item && typeof item.message === "string")
            .map((item) => ({
                id: item.id || this.createId(),
                message: item.message,
                isUser: Boolean(item.isUser),
                timestamp: item.timestamp || new Date().toISOString(),
                edited: Boolean(item.edited),
                editedAt: item.editedAt || null
            }));

        this.writeToStorage();
        this.emitChange("import");
        return this.getAllMessages();
    }

    exportMessages() {
        const payload = {
            meta: { lastSavedAt: this.lastSavedAt || null },
            messages: this.messages
        };

        return JSON.stringify(payload, null, 2);
    }

    readFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return { messages: [], lastSavedAt: null };

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return { messages: parsed, lastSavedAt: null };
            }

            if (parsed && Array.isArray(parsed.messages)) {
                return {
                    messages: parsed.messages,
                    lastSavedAt: parsed.meta?.lastSavedAt || null
                };
            }

            return { messages: [], lastSavedAt: null };
        } catch (err) {
            console.error("Failed to read chat history:", err);
            return { messages: [], lastSavedAt: null };
        }
    }

    writeToStorage() {
        try {
            this.lastSavedAt = new Date().toISOString();
            const payload = {
                meta: { lastSavedAt: this.lastSavedAt },
                messages: this.messages
            };

            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (err) {
            console.error("Failed to save chat history:", err);
        }
    }

    emitChange(reason) {
        this.dispatchEvent(new CustomEvent("change", {
            detail: {
                reason,
                messages: this.getAllMessages(),
                stats: this.getStats()
            }
        }));
    }

    createId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }
}
