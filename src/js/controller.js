import { getBotResponse } from "./eliza.js";

export class SimpleChatController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.pendingBotTimers = new Map();
        this.boundSend = (evt) => this.onSendMessage(evt);
        this.boundClear = () => this.onClearChat();
        this.boundDelete = (evt) => this.onDeleteMessage(evt);
        this.boundEdit = (evt) => this.onEditMessage(evt);
        this.boundExport = () => this.onExportChat();
        this.boundImport = (evt) => this.onImportChat(evt);
    }

    init(containerSelector = "#app") {
        this.registerViewEvents();
        this.view.render(containerSelector);
        this.view.displayImportedMessages(this.model.getAllMessages());
    }

    registerViewEvents() {
        this.view.addEventListener("sendMessage", this.boundSend);
        this.view.addEventListener("clearChat", this.boundClear);
        this.view.addEventListener("deleteMessage", this.boundDelete);
        this.view.addEventListener("editMessage", this.boundEdit);
        this.view.addEventListener("exportChat", this.boundExport);
        this.view.addEventListener("importChat", this.boundImport);
    }

    onSendMessage(evt) {
        const { message, isUser } = evt.detail;
        if (!message) return;

        const entry = this.model.addMessage(message, isUser);
        this.view.appendMessageToChat(entry, isUser);

        if (isUser) {
            const timerId = setTimeout(() => {
                const reply = getBotResponse(message);
                const botEntry = this.model.addMessage(reply, false);
                this.view.appendMessageToChat(botEntry, false);
                this.pendingBotTimers.delete(entry.id);
            }, 500);

            this.pendingBotTimers.set(entry.id, timerId);
        }
    }

    onClearChat() {
        this.model.clearMessages();
        this.view.clearChatMessages();
        this.pendingBotTimers.forEach((timerId) => clearTimeout(timerId));
        this.pendingBotTimers.clear();
    }

    onDeleteMessage(evt) {
        const { messageId } = evt.detail;
        if (!messageId) return;

        const removed = this.model.removeMessage(messageId);
        if (Array.isArray(removed) && removed.length > 0) {
            removed.forEach((entry) => {
                const timerId = this.pendingBotTimers.get(entry.id);
                if (timerId) {
                    clearTimeout(timerId);
                    this.pendingBotTimers.delete(entry.id);
                }
            });

            this.view.removeMessageFromChat(messageId);
        }
    }

    onEditMessage(evt) {
        const { messageId, newText } = evt.detail;
        if (!messageId || !newText) return;

        const result = this.model.updateMessage(messageId, newText);
        if (!result) return;

        const { updatedMessage, nextBotMessage } = result;
        this.view.updateMessageInChat(messageId, updatedMessage.message);

        const existingTimer = this.pendingBotTimers.get(messageId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.pendingBotTimers.delete(messageId);
        }

        if (nextBotMessage) {
            const reply = getBotResponse(newText);
            nextBotMessage.message = reply;
            nextBotMessage.editedAt = new Date().toISOString();
            this.model.writeToStorage();
            this.view.updateMessageInChat(nextBotMessage.id, reply);
        } else {
            const timerId = setTimeout(() => {
                const reply = getBotResponse(newText);
                const botEntry = this.model.addMessage(reply, false);
                this.view.appendMessageToChat(botEntry, false);
                this.pendingBotTimers.delete(messageId);
            }, 500);

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
            const sanitized = this.model.importMessages(importedData);
            this.view.displayImportedMessages(sanitized);
        } catch (err) {
            alert("Unable to import chat data.");
            console.error(err);
        }
    }
}
