// ============================================================
// Hazel AI — chhota backend (Node.js, koi extra package nahi)
// ------------------------------------------------------------
// Kaam: API key ko server par chhupa kar rakhta hai (browser me
// kabhi nahi aati), aapke app ki requests aage bhejta hai, aur
// har user par rate-limit lagata hai taaki credits control me rahein.
//
// Chalane ka tarika:
//   1) Node 18+ install hona chahiye.
//   2) Terminal me:
//        SARVAM_API_KEY="sk_xxxx" ADMIN_PASS="mera-password" node hazel-backend.js
//   3) Browser me kholo: http://localhost:3000
//
// Isi folder me "sarvam-pro-chat.html" bhi hona chahiye (wo serve hota hai).
// ============================================================

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT       = process.env.PORT || 3000;
const KEY        = process.env.SARVAM_API_KEY || "";     // <-- API key yahan (env se)
const ADMIN_PASS = process.env.ADMIN_PASS || "admin";    // <-- admin password
const UPSTREAM   = "https://api.sarvam.ai";

// Rate limit: ek IP se kitni requests per hour
const RATE_MAX    = Number(process.env.RATE_MAX || 60);
const RATE_WINDOW = 60 * 60 * 1000;

if (!KEY) console.warn("WARNING: SARVAM_API_KEY set nahi hai. Requests fail hongi.");

// ---- simple in-memory rate limit + usage counter ----
const hits = new Map();      // ip -> [timestamps]
let totalRequests = 0;

function rateOk(ip) {
  const now = Date.now();
  let arr = hits.get(ip) || [];
  arr = arr.filter(t => now - t < RATE_WINDOW);
  if (arr.length >= RATE_MAX) { hits.set(ip, arr); return false; }
  arr.push(now);
  hits.set(ip, arr);
  totalRequests++;
  return true;
}

const PROXY_PATHS = [
  "/v1/chat/completions",
  "/v2/chat/completions",
  "/text-to-speech",
  "/speech-to-text",
  "/text-lid"
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-admin-pass",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS"
};

function readBody(req) {
  return new Promise(resolve => {
    const c = [];
    req.on("data", d => c.push(d));
    req.on("end", () => resolve(Buffer.concat(c)));
  });
}
function sendJson(res, code, obj) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json" }, CORS));
  res.end(JSON.stringify(obj));
}

// Upstream ko request bhejo (https module se — koi dependency nahi)
function upstream(p, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(UPSTREAM + p);
    const r = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers },
      resp => {
        const chunks = [];
        resp.on("data", c => chunks.push(c));
        resp.on("end", () => resolve({ status: resp.statusCode, headers: resp.headers, body: Buffer.concat(chunks) }));
      }
    );
    r.on("error", reject);
    if (body && body.length) r.write(body);
    r.end();
  });
}

const server = http.createServer(async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0].trim();
  const url = req.url.split("?")[0];

  // CORS preflight
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); res.end(); return; }

  // ---- app serve karo ----
  if (req.method === "GET" && (url === "/" || url === "/index.html")) {
    const file = path.join(__dirname, "sarvam-pro-chat.html");
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(500); res.end("App file (sarvam-pro-chat.html) is folder me nahi mili."); return; }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // ---- icons / manifest bhi serve karo (PWA ke liye) ----
  if (req.method === "GET" && ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"].includes(url)) {
    const file = path.join(__dirname, url.slice(1));
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      const type = url.endsWith(".png") ? "image/png" : "application/manifest+json";
      res.writeHead(200, { "Content-Type": type }); res.end(data);
    });
    return;
  }

  // ---- admin usage stats ----
  if (req.method === "GET" && url === "/api/admin/stats") {
    if ((req.headers["x-admin-pass"] || "") !== ADMIN_PASS) { sendJson(res, 401, { error: "Galat admin password" }); return; }
    const perIp = {};
    for (const [k, v] of hits.entries()) {
      const recent = v.filter(t => Date.now() - t < RATE_WINDOW);
      if (recent.length) perIp[k] = recent.length;
    }
    sendJson(res, 200, { total_requests: totalRequests, active_ips: Object.keys(perIp).length, per_ip: perIp, rate_max_per_hour: RATE_MAX });
    return;
  }

  // ---- API proxy ----
  if (req.method === "POST" && PROXY_PATHS.includes(url)) {
    if (!KEY) { sendJson(res, 500, { error: "Server par API key set nahi hai." }); return; }
    if (!rateOk(ip)) { sendJson(res, 429, { error: "Bahut zyada requests. Thodi der baad try karein." }); return; }

    const body = await readBody(req);
    const headers = {};
    if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"]; // multipart boundary bhi
    headers["api-subscription-key"] = KEY;

    try {
      const up = await upstream(url, "POST", headers, body);
      res.writeHead(up.status, Object.assign(
        { "Content-Type": up.headers["content-type"] || "application/json" }, CORS));
      res.end(up.body);
    } catch (e) {
      sendJson(res, 502, { error: "Upstream error: " + e.message });
    }
    return;
  }

  res.writeHead(404, CORS); res.end("Not found");
});

server.listen(PORT, () => {
  console.log("Hazel backend chal raha hai -> http://localhost:" + PORT);
  console.log("Rate limit: " + RATE_MAX + " requests/hour per user");
});
