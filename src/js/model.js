export class SimpleChatModel {
    constructor(storageKey = "chatHistory") {
        this.storageKey = storageKey;
        this.messages = this.readFromStorage();
    }

    getAllMessages() {
        return [...this.messages];
    }

    addMessage(text, isUser) {
        const entry = {
            id: this.createId(),
            message: text,
            isUser: Boolean(isUser),
            timestamp: new Date().toISOString()
        };

        this.messages.push(entry);
        this.writeToStorage();
        return entry;
    }

    updateMessage(messageId, newText) {
        const index = this.messages.findIndex((msg) => msg.id === messageId);
        if (index === -1) return null;

        const target = this.messages[index];
        target.message = newText;
        target.editedAt = new Date().toISOString();

        let nextBotMessage = null;
        for (let i = index + 1; i < this.messages.length; i++) {
            const candidate = this.messages[i];
            if (candidate.isUser) break;
            if (!candidate.isUser) {
                nextBotMessage = candidate;
                break;
            }
        }

        this.writeToStorage();
        return {
            updatedMessage: target,
            nextBotMessage
        };
    }

    removeMessage(messageId) {
        const index = this.messages.findIndex((msg) => msg.id === messageId);
        if (index === -1) return [];

        const removed = this.messages.splice(index);
        this.writeToStorage();
        return removed;
    }

    clearMessages() {
        this.messages = [];
        this.writeToStorage();
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
                timestamp: item.timestamp || new Date().toISOString()
            }));

        this.writeToStorage();
        return this.getAllMessages();
    }

    exportMessages() {
        return JSON.stringify(this.messages, null, 2);
    }

    readFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed;
        } catch (err) {
            console.error("Failed to read chat history:", err);
            return [];
        }
    }

    writeToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
        } catch (err) {
            console.error("Failed to save chat history:", err);
        }
    }

    createId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }
}
