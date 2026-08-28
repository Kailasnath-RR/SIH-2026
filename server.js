const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env file if available
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf8").split("\n");
  envLines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.trim();
    }
  });
}

const locationService = require("./server/services/locationService");
const climateService = require("./server/services/climateService");
const thermalService = require("./server/services/thermalService");
const designEngine = require("./server/services/designEngine");
const materialService = require("./server/services/materialService");
const aiService = require("./server/services/aiService");
const reportService = require("./server/services/reportService");
const elevationService = require("./server/services/elevationService");

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 4174;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const filePath = requestPath === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, requestPath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(resolved).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  try {
    // REST API Routes
    if (req.method === "GET" && pathname === "/api/status") {
      return sendJson(res, 200, {
        app: "SHELTR.AI",
        version: "2.2.0",
        mode: "production-ready",
        services: {
          mapProvider: process.env.MAP_PROVIDER || "maptiler",
          geospatial: "real-india-geojson-validated",
          weatherProvider: "Open-Meteo 36-State Live Batch",
          elevationProvider: process.env.ELEVATION_PROVIDER || "open_meteo",
          thermalEngine: "Steadman-5-Component",
          ruleEngine: "explicit-triggers-v2",
          aiEngine: "context-bound-deterministic"
        }
      });
    }

    if (req.method === "GET" && pathname === "/api/config") {
      return sendJson(res, 200, {
        mapProvider: process.env.MAP_PROVIDER || "maptiler",
        mapApiKey: process.env.MAP_API_KEY || "",
        weatherProvider: process.env.WEATHER_PROVIDER || "open_meteo",
        elevationProvider: process.env.ELEVATION_PROVIDER || "open_meteo"
      });
    }

    if (req.method === "GET" && pathname === "/api/climate/states") {
      const statesClimate = await climateService.fetchAllStatesClimate();
      return sendJson(res, 200, { states: statesClimate });
    }

    if (req.method === "GET" && pathname === "/api/terrain/elevation") {
      const lat = Number(reqUrl.searchParams.get("lat")) || 12.2958;
      const lng = Number(reqUrl.searchParams.get("lng")) || 76.6394;
      const elevData = await elevationService.getElevation(lat, lng);
      return sendJson(res, 200, elevData);
    }

    if (req.method === "GET" && pathname === "/api/location/search") {
      const q = reqUrl.searchParams.get("q") || "";
      const results = locationService.search(q);
      return sendJson(res, 200, { results });
    }

    if (req.method === "GET" && pathname === "/api/climate") {
      const lat = Number(reqUrl.searchParams.get("lat")) || 26.14;
      const lng = Number(reqUrl.searchParams.get("lng")) || 91.73;
      const name = reqUrl.searchParams.get("name") || "Selected Location";
      const state = reqUrl.searchParams.get("state") || "Assam";
      const elevation = Number(reqUrl.searchParams.get("elevation")) || 55;

      const loc = { name, state, lat, lng, elevation };
      const climate = await climateService.getCurrentConditions(loc);
      return sendJson(res, 200, { climate });
    }

    if (req.method === "GET" && pathname === "/api/climate/hourly") {
      const lat = Number(reqUrl.searchParams.get("lat")) || 26.14;
      const lng = Number(reqUrl.searchParams.get("lng")) || 91.73;
      const name = reqUrl.searchParams.get("name") || "Selected Location";

      const loc = { name, lat, lng };
      const hourlyData = await climateService.getHourlyConditions(loc);
      return sendJson(res, 200, hourlyData);
    }

    if (req.method === "POST" && pathname === "/api/design/analyze") {
      const body = await parseJsonBody(req);
      const loc = body.location || { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, elevation: 55 };
      const siteContext = body.siteContext || {};
      const userOverrides = body.userOverrides || {};

      const analysis = await thermalService.analyze(loc);
      const designRecs = designEngine.recommend(analysis, siteContext);

      if (Object.keys(userOverrides).length > 0) {
        designRecs.breakdown = designEngine.calculateWeightedScore(designRecs.params, analysis, siteContext, userOverrides);
        designRecs.totalScore = designRecs.breakdown.totalScore;
      }

      const materials = materialService.getAllMaterials();

      return sendJson(res, 200, {
        location: loc,
        siteContext,
        analysis,
        design: designRecs,
        materials
      });
    }

    if (req.method === "POST" && pathname === "/api/assistant") {
      const body = await parseJsonBody(req);
      const question = body.question || "";
      const context = body.context || {};
      const answer = aiService.answerQuestion(question, context);
      return sendJson(res, 200, { answer });
    }

    if (req.method === "POST" && pathname === "/api/report") {
      const body = await parseJsonBody(req);
      const html = reportService.generateHtmlReport(body);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html);
    }

    if (pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "API route not found." });
    }

    // Static file handler
    serveStatic(req, res);
  } catch (err) {
    console.error("Server error handling request:", err);
    sendJson(res, 500, { error: err.message || "Internal server error" });
  }
});

function listen(port) {
  server.once("error", error => {
    if (error.code === "EADDRINUSE") {
      listen(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`SHELTR.AI v2.2 running at http://localhost:${port}`);
  });
}

listen(START_PORT);
