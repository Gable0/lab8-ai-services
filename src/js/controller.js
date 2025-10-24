import { getBotResponse } from "./eliza.js";

export class SimpleChatController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.pendingBotTimers = new Map();

        this.botReplyDelayMs = 250;

        this.boundSend = (evt) => this.onSendMessage(evt);
        this.boundClear = () => this.onClearChat();
        this.boundDelete = (evt) => this.onDeleteMessage(evt);
        this.boundEdit = (evt) => this.onEditMessage(evt);
        this.boundExport = () => this.onExportChat();
        this.boundImport = (evt) => this.onImportChat(evt);
        this.boundModelChange = (evt) => this.onModelChange(evt);
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
    }

    onModelChange(evt) {
        const { messages, stats } = evt.detail;
        this.view.renderMessages(messages);
        this.view.updateStats(stats);
    }

    syncViewWithModel() {
        this.view.renderMessages(this.model.getAllMessages());
        this.view.updateStats(this.model.getStats());
    }

    onSendMessage(evt) {
        const { message, isUser } = evt.detail;
        if (!message) return;

        const entry = this.model.addMessage(message, isUser);

        if (isUser) {
            const timerId = setTimeout(() => {
                const reply = getBotResponse(message);
                this.model.addMessage(reply, false);
                this.pendingBotTimers.delete(entry.id);
            }, this.botReplyDelayMs);

            this.pendingBotTimers.set(entry.id, timerId);
        }
    }

    onClearChat() {
        const removed = this.model.clearMessages();
        removed
            .filter((message) => message.isUser)
            .forEach((message) => this.cancelBotTimer(message.id));
        this.cancelAllBotTimers();
    }

    onDeleteMessage(evt) {
        const { messageId } = evt.detail;
        if (!messageId) return;

        const removed = this.model.removeMessage(messageId);
        if (!Array.isArray(removed) || removed.length === 0) return;

        removed
            .filter((message) => message.isUser)
            .forEach((message) => this.cancelBotTimer(message.id));
    }

    onEditMessage(evt) {
        const { messageId, newText } = evt.detail;
        const trimmed = newText ? newText.trim() : "";
        if (!messageId || !trimmed) return;

        const { nextBotMessage } = this.model.updateUserMessage(messageId, trimmed);

        this.cancelBotTimer(messageId);

        if (nextBotMessage) {
            const reply = getBotResponse(trimmed);
            this.model.updateMessageContent(nextBotMessage.id, reply, { markEdited: true });
        } else {
            const timerId = setTimeout(() => {
                const reply = getBotResponse(trimmed);
                this.model.addMessage(reply, false);
                this.pendingBotTimers.delete(messageId);
            }, this.botReplyDelayMs);

            this.pendingBotTimers.set(messageId, timerId);
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
        } catch (err) {
            alert("Unable to import chat data.");
            console.error(err);
        }
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
