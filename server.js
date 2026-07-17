// ─────────────────────────────────────────────────────────────
// MediFlow AI — Local Development Server
//
// Does two things:
// 1. Serves your HTML files as a website (replaces Live Server)
// 2. Proxies /api/chat → ilmu.ai ZAI GLM API (fixes CORS)
//
// Usage:
//   node server.js
//
// Then open: http://localhost:3000
//
// Set your API key in .env as: ZAI_API_KEY=sk-...
//
// ⚠️  IMPORTANT — ilmu.ai uses the OpenAI-compatible format:
//   - "system" must be inside messages array, NOT a top-level field
//   - Use models like: glm-4-flash, glm-4-air, glm-4
//   - Authorization: Bearer <your-key>
// ─────────────────────────────────────────────────────────────

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// ── Load .env manually (no dotenv dependency needed) ──────────
function loadEnv() {
    try {
        const envPath = path.join(__dirname, ".env");
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1) continue;
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            process.env[key] = val;
        }
    } catch (_) {
        // No .env file — key must come from the request payload
    }
}
loadEnv();

// ── MIME types ────────────────────────────────────────────────
const MIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
};

// ─────────────────────────────────────────────────────────────
// API PROXY — POST /api/chat → ilmu.ai ZAI GLM
//
// ilmu.ai is OpenAI-compatible. Key rules:
//   ✅  Authorization: Bearer <key>
//   ✅  POST /v1/chat/completions
//   ✅  { model, messages, max_tokens }
//   ✅  "system" goes as { role:"system", content:"..." } in messages[]
//   ❌  No top-level "system" field (that's Anthropic format)
// ─────────────────────────────────────────────────────────────
function proxyToIlmu(req, res) {
    let body = "";

    req.on("data", chunk => { body += chunk; });

    req.on("end", () => {

        // ── 1. Parse incoming JSON ───────────────────────────
        let payload;
        try {
            payload = JSON.parse(body);
        } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON from client" }));
            return;
        }

        // ── 2. Resolve API key ───────────────────────────────
        const apiKey = process.env.ZAI_API_KEY || payload.apiKey;

        if (!apiKey) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: "Missing ZAI_API_KEY. Add it to your .env file as: ZAI_API_KEY=sk-..."
            }));
            return;
        }

        // ── 3. Build messages array ──────────────────────────
        //
        // If the caller passed a top-level "system" string (Anthropic style),
        // we convert it to a proper { role:"system", content } message at the
        // front of the array so ilmu.ai understands it.
        //
        let messages = payload.messages || [];

        if (payload.system && typeof payload.system === "string") {
            const alreadyHasSystem = messages.some(m => m.role === "system");
            if (!alreadyHasSystem) {
                messages = [{ role: "system", content: payload.system }, ...messages];
            }
        }

        // ── 4. Build request body ────────────────────────────
        const model = payload.model || process.env.ILMU_MODEL || "ilmu-glm-5.1";
        const max_tokens = payload.max_tokens || 1000;
        const temperature = payload.temperature ?? 0.7;

        const requestBody = JSON.stringify({
            model,
            max_tokens,
            temperature,
            messages,
        });

        // ── 5. Log ───────────────────────────────────────────
        console.log("\n[Proxy] ──────────────────────────────────");
        console.log("[Proxy] model      :", model);
        console.log("[Proxy] key prefix :", apiKey.substring(0, 12) + "...");
        console.log("[Proxy] messages   :", messages.length, "turns");
        console.log("[Proxy] roles      :", messages.map(m => m.role).join(", "));
        console.log("[Proxy] endpoint   : api.ilmu.ai /v1/chat/completions");
        console.log("[Proxy] ──────────────────────────────────");

        // ── 6. Forward to ilmu.ai ────────────────────────────
        const options = {
            hostname: "api.ilmu.ai",
            path: "/v1/chat/completions",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Length": Buffer.byteLength(requestBody),
            },
        };

        let headersSent = false;

        const proxyReq = https.request(options, proxyRes => {
            let responseData = "";
            proxyRes.on("data", chunk => { responseData += chunk; });
            proxyRes.on("end", () => {
                if (headersSent) return;
                headersSent = true;
                console.log("[Proxy] ilmu.ai status :", proxyRes.statusCode);
                if (proxyRes.statusCode !== 200) {
                    console.error("[Proxy] ilmu.ai error body:", responseData);
                }
                res.writeHead(proxyRes.statusCode, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                });
                res.end(responseData);
            });
        });

        proxyReq.setTimeout(1800000, () => {
            proxyReq.destroy();
            if (headersSent) return;
            headersSent = true;
            console.error("[Proxy] Timeout after 180s");
            res.writeHead(504, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "ilmu.ai timeout — try again" }));
        });

        proxyReq.on("error", err => {
            if (headersSent) return;
            headersSent = true;
            console.error("[Proxy error]", err.message);
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Cannot reach api.ilmu.ai — " + err.message }));
        });

        proxyReq.write(requestBody);
        proxyReq.end();
    });
}

// ─────────────────────────────────────────────────────────────
// STATIC FILE SERVER
// ─────────────────────────────────────────────────────────────
function serveStatic(req, res) {
    let filePath = req.url === "/" ? "/index.html" : req.url;
    filePath = filePath.split("?")[0]; // strip query strings

    // Try website/templates first, then root directory
    let fullPath = path.join(__dirname, "website", "templates", filePath);
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(__dirname, filePath);
    }

    const ext = path.extname(fullPath);

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            console.warn("[Static] 404:", filePath);
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found: " + filePath);
            return;
        }
        res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
        res.end(data);
    });
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVER
// ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {

    // CORS preflight (OPTIONS)
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
    }

    // API proxy route
    if (req.method === "POST" && req.url === "/api/chat") {
        console.log("[API] Incoming request → forwarding to ilmu.ai...");
        proxyToIlmu(req, res);
        return;
    }

    // Everything else → serve static files
    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log("─────────────────────────────────────────────────");
    console.log("  MediFlow AI server running!");
    console.log("  Open: http://localhost:" + PORT);
    console.log("");
    console.log("  ZAI_API_KEY loaded:", !!process.env.ZAI_API_KEY
        ? `✅ (starts with ${process.env.ZAI_API_KEY.substring(0, 8)}...)`
        : "❌ Not found in .env — add it!");
    console.log("─────────────────────────────────────────────────");
    console.log("");
    console.log("  Quick test (CMD):");
    console.log('  curl -X POST http://localhost:3000/api/chat ^');
    console.log('    -H "Content-Type: application/json" ^');
    console.log('    -d "{\\"model\\":\\"ilmu-glm-5.1\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Say hello.\\"}]}"');
    console.log("─────────────────────────────────────────────────");
});