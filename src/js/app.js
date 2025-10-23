import { SimpleChatModel } from "./model.js";
import { SimpleChatView } from "./view.js";
import { SimpleChatController } from "./controller.js";

function initApp() {
    document.addEventListener("DOMContentLoaded", () => {
        const model = new SimpleChatModel();
        const view = new SimpleChatView();
        const controller = new SimpleChatController(model, view);
        controller.init("#app");
    });
}

initApp();
