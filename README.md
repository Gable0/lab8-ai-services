# Chat Assistant – Lab 7 (MVC + CRUD)
Fall 2025 · COMP 305

---

## Architecture Overview

This is a small chat app that follows a basic Model–View–Controller layout.

- **Model (`src/js/model.js`)**  
  Keeps an array of messages, saves them (plus a last-saved timestamp) to `localStorage`, and handles import/export. It extends `EventTarget`, so every CRUD change dispatches a `change` event that the rest of the app can react to.

- **View (`src/js/view.js`)**  
  Draws the chat box, wires up button clicks, renders the message list, and fires events like `sendMessage` or `deleteMessage`. It also controls the edit/delete buttons that show up on your messages.

- **Controller (`src/js/controller.js`)**  
  Listens to the view events and updates the model. Because the model now broadcasts updates, the controller simply forwards the latest messages/stats to the view. It also starts the short bot reply timer and cancels those timers if you edit, delete, import, or clear messages.

- **Bot (`src/js/eliza.js`)**  
  Just returns a reply string based on what you typed. The controller calls it whenever it needs a response.

Most of the look and feel lives in `src/styles.css`, which I tweaked to match the reference screenshot.

---

## User Guide

1. **Launch**  
   Open `src/index.html` with Live Server (or any local web server). The script in `src/js/app.js` kicks on and builds the app.

2. **Send Messages**  
   Type in the bottom bar. Once there’s text, the Send button lights up. Your message shows on the right and, a quarter-second later, the bot answer shows on the left.

3. **Edit or Delete**  
   Click your own message to see the edit/delete buttons. Editing triggers a fresh bot reply based on the new text (and marks both entries as edited). Deleting removes the selected message plus everything beneath it so the conversation stays aligned with bot replies.

4. **Import / Export / Clear**  
   - *Export* saves every message plus metadata to a JSON file.  
   - *Import* reads either the export format or a plain array of message objects.  
   - *Clear* wipes the chat and clears `localStorage` after a quick confirmation.

5. **Persistence**  
   Because the model writes to `localStorage`, reloading the page brings back your chat unless you cleared it.

---

## Reflections & Notes

- Using DOM events for the MVC setup keeps each file focused on its own job instead of mixing everything together.
- Cascading deletes keep user/bot exchanges paired; the model change events ensure the view and stored data stay in sync after a wipe.
- Tracking timers in the controller (plus the helper that cancels them on every destructive action) makes sure edited messages get new bot replies without duplicate responses.
- Styling took a couple of tries, but the final version feels close to the example while still being original.

---

## Helpful Links

- **Source Folder**: [`src/`](./src)  
- **Entry Point**: [`src/js/app.js`](./src/js/app.js)  
- **Model**: [`src/js/model.js`](./src/js/model.js)  
- **View**: [`src/js/view.js`](./src/js/view.js)  
- **Controller**: [`src/js/controller.js`](./src/js/controller.js)  
- **Bot Logic**: [`src/js/eliza.js`](./src/js/eliza.js)

---

## Requirements Checklist

- ✅ Clear explanation of architecture  
- ✅ User guide for features  
- ✅ Thoughtful reflections on decisions  
- ✅ Links to key modules and technical notes
