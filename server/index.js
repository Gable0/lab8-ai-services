import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
const port=process.env.PORT || 3001;

if(!process.env.OPENAI_API_KEY){
    throw new Error("Missing OPENAI_API_KEY in env");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({origin: "http://localhost:5173"}));
app.use(express.json());

app.post("/api/chatgpt", async (req, res) => {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Body must include a string `message`." });
    }
    
    try{
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", 
            max_tokens: 500,
            messages: [
                {role: "system", content: "You are a helpful assistant."},
                {role: "user", content: message}
            ]
        });

            const reply = completion?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
        return res.status(502).json({ error: "ChatGPT returned an empty response." });
    }

    res.json({ reply });
    } catch (error) {
    console.error("ChatGPT proxy failed:", error);
    res.status(500).json({ error: "ChatGPT request failed. Check server logs." });
    }
});

app.listen(port, () => {
    console.log(`ChatGPT proxy listening on http://localhost:${port}`);
});
