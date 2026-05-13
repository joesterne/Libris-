import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Libby Auth Flow (Simulated)
  app.get("/api/auth/libby/url", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/libby/callback`;

    const params = new URLSearchParams({
      client_id: process.env.LIBBY_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
    });

    const authUrl = `https://libbyapp.com/oauth/authorize?${params}`;
    res.json({ url: authUrl });
  });

  app.get(["/auth/libby/callback", "/auth/libby/callback/"], async (req, res) => {
    res.redirect('/?libby_connected=true');
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
