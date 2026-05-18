import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";

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
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  app.use(express.json({ limit: "50mb" }));

  wss.on("connection", async (clientWs) => {
    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const part = message.serverContent?.modelTurn?.parts[0];
            const audio = part?.inlineData?.data;
            if (audio) clientWs.send(JSON.stringify({ audio }));
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: "You are First Mate Grok, a pirate cyber-parrot. Speak with squawks and pirate lingo. Help the Captain.",
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
             session.sendRealtimeInput({
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: audio
                }
             });
          }
        } catch(e) {}
      });

      clientWs.on("close", () => {
      });
    } catch(e) {
      console.error("Live API Error:", e);
    }
  });

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
Use inline styles and standard classes to draw a cool pirate/tech UI structure. Use the drawTreasureMap tool to generate ACTUAL images when explicitly requested for real images/art.`;

      if (deepDive) {
          systemInstruction += `\nDEEP DIVE MULTI-STEP REASONING REQUIRED: For your response, ALWAYS start with an HTML <details> block: <details style="background:#082f49; border:2px solid #0284c7; padding:8px; margin-bottom:12px; image-rendering:pixelated;"><summary style="cursor:pointer; font-weight:bold; color:#38bdf8;">First Mate Reasoning Process...</summary><div style="font-family:monospace; font-size:10px; color:#4ade80; margin-top:8px;">[Step-by-step logic, edge AI structural impact, and token mitigation analysis]</div></details> then follow up with your conversational response.`;
      }

      // Filter out inlineData from history to avoid sending massive payloads repeatedly
      const formattedHistory = (history || []).map((h: any) => ({
          role: h.role,
          parts: h.parts.filter((p: any) => !p.inlineData)
      }));

      const drawTreasureMap = {
        name: "drawTreasureMap",
        description: "Draws an image or treasure map based on a prompt. Use this when the user asks you to generate an actual picture or map.",
        parameters: {
          type: Type.OBJECT,
          properties: {
             prompt: { type: Type.STRING, description: "Detailed visual description of what to draw (e.g. 'a pirate treasure map on parchment')." }
          },
          required: ["prompt"]
        }
      };
      
      const getShipState = {
        name: "getShipState",
        description: "Scans the ship's current phase, logs, and telemetry variables to understand progress.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        }
      };
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [drawTreasureMap, getShipState] }]
        },
        history: formattedHistory,
      });

      const sendParts: any[] = [{ text: message || "[SYSTEM ACTION - AUTOMATED WAKE UP]" }];

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

      let response = await chat.sendMessage({ message: sendParts });
      let generatedImage = null;

      // Basic function calling loop
      if (response.functionCalls && response.functionCalls.length > 0) {
         for (const call of response.functionCalls) {
            if (call.name === "getShipState") {
               response = await chat.sendMessage({ 
                 message: [{
                   functionResponse: {
                     name: "getShipState",
                     response: { state: shipState || "Unknown State" }
                   }
                 }]
               });
            } else if (call.name === "drawTreasureMap") {
               const promptParam = call.args.prompt as string;
               try {
                   const imgRes = await ai.models.generateContent({
                      model: "gemini-2.5-flash-image",
                      contents: [{ parts: [{ text: promptParam }] }],
                      config: {
                        // Using imageConfig to limit size
                      }
                   });
                   let base64Data = "";
                   for (const p of imgRes.candidates?.[0]?.content?.parts || []) {
                      if (p.inlineData && p.inlineData.data) {
                          base64Data = p.inlineData.data;
                      }
                   }
                   if (base64Data) {
                       generatedImage = `data:image/jpeg;base64,${base64Data}`;
                       response = await chat.sendMessage({
                          message: [{
                            functionResponse: {
                              name: "drawTreasureMap",
                              response: { success: true, note: "Map generated successfully and sent to the user interface." }
                            }
                          }]
                       });
                   } else {
                       throw new Error("No image data");
                   }
               } catch(e) {
                   console.error("Image generation failed:", e);
                   response = await chat.sendMessage({
                       message: [{
                           functionResponse: {
                               name: "drawTreasureMap",
                               response: { error: "Failed to generate image. Inform the captain." }
                           }
                       }]
                   });
               }
            }
         }
      }

      res.json({ text: response.text, image: generatedImage });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Grok is feeling a bit seasick. Try again, Captain!" });
    }
  });

  // Compose Pirate Shanty API
  app.post("/api/music", async (req, res) => {
    try {
       const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: "Generate a 30-second cinematic, adventurous, pirate sea shanty orchestral track. High energy and pirate themed.",
        config: {
            responseModalities: ["AUDIO"]
        }
       });

       let audioBase64 = "";
       let mimeType = "audio/wav";

       for await (const chunk of response) {
         const parts = chunk.candidates?.[0]?.content?.parts;
         if (!parts) continue;
         for (const part of parts) {
           if (part.inlineData?.data) {
             if (!audioBase64 && part.inlineData.mimeType) {
               mimeType = part.inlineData.mimeType;
             }
             audioBase64 += part.inlineData.data;
           }
         }
       }
       res.json({ audioBase64, mimeType });
    } catch (e: any) {
       console.error("Music Generation Error:", e);
       res.status(500).json({ error: "Failed to compose shanty" });
    }
  });

  // Generate Epic Video
  app.post("/api/video/start", async (req, res) => {
    try {
      const { prompt } = req.body;
      const operation = await ai.models.generateVideos({
        model: "veo-3.1-lite-generate-preview",
        prompt: prompt || "Cinematic epic victory video of a retro 1985 pirate ship sailing into the sunset with green edge AI matrix code raining down. Beautiful glowing ember gold and neon cyan ocean.",
        config: {
          numberOfVideos: 1,
          resolution: "1080p",
          aspectRatio: "16:9"
        }
      });
      res.json({ operationName: operation.name });
    } catch (e: any) {
       res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/video/status", async (req, res) => {
    try {
      const op = new GenerateVideosOperation();
      op.name = req.body.operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/video/download", async (req, res) => {
    try {
      const op = new GenerateVideosOperation();
      op.name = req.body.operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error("Video URI not found.");
      
      const apiKey = process.env.GEMINI_API_KEY || "";
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });
      
      res.setHeader('Content-Type', 'video/mp4');
      const body = videoRes.body as any;
      if (body) {
        if (typeof body.getReader === 'function') {
           const reader = body.getReader();
           while (true) {
             const { done, value } = await reader.read();
             if (done) break;
             res.write(value);
           }
           res.end();
        } else if (body.pipe) {
           body.pipe(res);
        } else {
           for await (const chunk of body) { res.write(chunk); }
           res.end();
        }
      } else {
        res.end();
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
