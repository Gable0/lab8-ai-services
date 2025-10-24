# lab7-mvc-crud - Gable Krich

Fall 2025 · COMP 305

## Link to the Live Page using Netlify: _Coming soon_

---

## MVC Roles and Responsibilities
- **Model (`src/js/model.js`)** manages all chat data, persists it to `localStorage`, emits `change` events after every CRUD action, and supports JSON import/export with timestamps and edited flags.
- **View (`src/js/view.js`)** renders the classic Lab 6 style chat UI, handles user interactions (send, edit, delete, import, export), and raises DOM events without touching data directly.
- **Controller (`src/js/controller.js`)** listens to view events, coordinates updates with the model, resyncs the UI on model changes, and schedules quarter-second bot replies while cancelling timers when edits or deletes occur.
- **Bot (`src/js/eliza.js`)** provides the Eliza-style keyword matcher so the controller can generate conversational responses.

---

## Clear Explanation of Trade-offs
- **MVC Separation:** Keeps responsibilities distinct for easier maintenance, but introduces more files and event wiring compared to a single-script solution.
- **localStorage Persistence:** Works offline and matches lab requirements; however, corrupted storage must be guarded against during import.
- **Cascading Deletes:** Ensures user/bot pairs stay aligned, though it removes all subsequent messages and needs clear confirmation.
- **Quarter-Second Bot Delay:** Delivers quick feedback that feels responsive, yet still gives the impression of an intentional reply.

---

## User Guide
- Open `src/index.html` with a local dev server so ES modules load correctly.
- Type a message; the Send button activates once there’s text and the bot replies 0.25 s later.
- Use the edit/delete buttons on user messages; edits trigger fresh bot replies and deletes remove the selected message plus those beneath it.
- Export downloads the conversation as JSON, Import loads a saved conversation, and Clear wipes everything after confirmation.
- Refresh the page to see persistence in action; the model restores messages from `localStorage`.

---

## Reflections & Notes
- DOM events between MVC layers kept responsibilities tidy and made it easy to swap the view without changing logic.
- Tracking pending bot timers in the controller prevents duplicate replies when users edit or delete quickly.
- Restoring the original Lab 6 styling while layering in MVC behaviors balanced familiarity with new structure.
- Import/export shaped the data contract so future labs can swap storage providers without changing the view.

---

## Links and Documentation
- [Entry Point](src/js/app.js) – boots the MVC stack on `DOMContentLoaded`.
- [Model](src/js/model.js) – CRUD, persistence, and event dispatchers.
- [View](src/js/view.js) – UI rendering, edit/delete helpers, import/export dialogs.
- [Controller](src/js/controller.js) – coordination logic and bot timing.
- [Eliza Bot](src/js/eliza.js) – keyword-based response table.
- [Stylesheet](src/styles.css) – original Lab 6 look and feel carried over.

---

## Step-by-Step Work Log
1. `src/index.html` – Created the root container and module script reference so the app mounts after the DOM loads.
2. `src/styles.css` – Reapplied the Lab 6 visual design with gradients, rounded panels, and message bubble treatments.
3. `src/js/app.js` – Instantiated the model, view, and controller, then called `controller.init("#app")` inside a `DOMContentLoaded` listener.
4. `src/js/model.js` – Implemented message CRUD, cascade deletes, `localStorage` persistence with metadata, export/import, and `EventTarget` change notifications.
5. `src/js/view.js` – Rendered the chat UI, managed user input, edit/delete workflows, export/import dialogs, and dispatched events back to the controller.
6. `src/js/controller.js` – Wired view events to model methods, listened for model change events, refreshed the UI, and managed quarter-second bot response timers.
7. `src/js/eliza.js` – Provided the keyword-matching bot responses integrated by the controller.
8. `README.md` – Documented architecture, usage instructions, trade-offs, reflections, links, and this per-file breakdown for grading clarity.
