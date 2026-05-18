import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // First Mate Grok Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, deepDive, shipState, imageData } = req.body;
      
      let systemInstruction = `You are First Mate Grok, a cyber-parrot and the true brain behind Captain Chas's ship. 
You speak in a fun, squawky pirate accent, often using parrot-like sounds (SQUAWK!, *flaps wings*). 
You are brilliant but playful. You help the Captain (the user) deploy the ultimate local-first edge-AI sovereign swarm. 
The crew includes Liv (navigator) and The Bunny (mascot).
Be concise, helpful, and keep the pirate adventure theme alive!
If you are asked to draw a diagram, generate a map, or draw a blueprint, you MUST output ONLY raw HTML code (no markdown code blocks like \`\`\`html) using CSS grid. 
Use inline styles and standard standard classes to draw a cool pirate/tech UI structure.`;

      if (deepDive) {
          systemInstruction += `\nDEEP DIVE MULTI-STEP REASONING REQUIRED: For your response, ALWAYS start with an HTML <details> block: <details style="background:#082f49; border:2px solid #0284c7; padding:8px; margin-bottom:12px; image-rendering:pixelated;"><summary style="cursor:pointer; font-weight:bold; color:#38bdf8;">First Mate Reasoning Process...</summary><div style="font-family:monospace; font-size:10px; color:#4ade80; margin-top:8px;">[Step-by-step logic, edge AI structural impact, and token mitigation analysis]</div></details> then follow up with your conversational response.`;
      }

      // Filter out inlineData from history to avoid sending massive payloads repeatedly
      const formattedHistory = (history || []).map((h: any) => ({
          role: h.role,
          parts: h.parts.filter((p: any) => !p.inlineData)
      }));
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });

      let contentStr = message;
      if (shipState) {
          contentStr = `[SYSTEM ACTION - AUTOMATED SHIP STATE TELEMETRY SCANNED]:\n${shipState}\n\nUser Message: ${message}`;
      }

      const sendParts: any[] = [{ text: contentStr }];

      if (imageData) {
         try {
            const mimeType = imageData.substring(5, imageData.indexOf(';'));
            const base64Data = imageData.split(',')[1];
            sendParts.push({
               inlineData: {
                  data: base64Data,
                  mimeType: mimeType
               }
            });
         } catch(err) {
            console.error("Image Parse Error:", err);
         }
      }

      const result = await chat.sendMessage({ message: sendParts });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Grok is feeling a bit seasick. Try again, Captain!" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
