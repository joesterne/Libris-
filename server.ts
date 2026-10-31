import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { getBookRecommendations, chatWithAssistant, deepLiteraryAnalysis } from "./src/lib/gemini";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // AI endpoints — the Gemini key lives only on the server. The browser used
  // to import src/lib/gemini directly while vite.config inlined the key into
  // the client bundle, so every visitor could extract and abuse it. The
  // client now calls these via src/lib/aiClient.ts.
  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { history, currentBooks, liked, disliked } = req.body;
      res.json(await getBookRecommendations(history || [], currentBooks || [], liked || [], disliked || []));
    } catch (error) {
      console.error("Recommendations failed:", error);
      res.status(500).json({ error: "Recommendations failed" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const history = Array.isArray(req.body.history) ? req.body.history : [];
      res.json({ text: await chatWithAssistant(req.body.message, history) });
    } catch (error) {
      console.error("Chat failed:", error);
      res.status(500).json({ error: "Chat failed" });
    }
  });

  app.post("/api/ai/analysis", async (req, res) => {
    try {
      res.json({ text: await deepLiteraryAnalysis(req.body.query) });
    } catch (error) {
      console.error("Analysis failed:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Libby: there is NO real Libby/OverDrive integration in this app. The old
  // flow was worse than absent — the OAuth callback discarded the code,
  // never exchanged tokens, and unconditionally redirected to
  // /?libby_connected=true, which the client trusted from ANY visit to mark
  // the account "Connected" (forgeable by typing the URL). The endpoint now
  // says so honestly instead of staging a fake sign-in.
  app.get("/api/auth/libby/url", (req, res) => {
    res.status(501).json({ error: "Libby connection is not available — the Libby features in this demo are simulated." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
