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
const siteIntelligenceService = require("./server/services/siteIntelligenceService");

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
      if (!path.extname(resolved)) {
        fs.readFile(path.join(ROOT, "index.html"), (err, indexContent) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
            return;
          }
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
          });
          res.end(indexContent);
        });
        return;
      }
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

    if (req.method === "GET" && pathname === "/api/geocode/search") {
      const q = reqUrl.searchParams.get("q") || "";
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
        const mod = require("https");
        const fetchJson = (u) => new Promise((resolve, reject) => {
          mod.get(u, (resp) => {
            let data = "";
            resp.on("data", chunk => data += chunk);
            resp.on("end", () => {
              try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
          }).on("error", reject);
        });
        const geocodeData = await fetchJson(url);
        return sendJson(res, 200, { results: geocodeData.results || [] });
      } catch (e) {
        return sendJson(res, 500, { error: e.message });
      }
    }

    if (req.method === "GET" && pathname === "/api/site-intelligence") {
      const lat = Number(reqUrl.searchParams.get("lat"));
      const lng = Number(reqUrl.searchParams.get("lng"));
      if (isNaN(lat) || isNaN(lng)) return sendJson(res, 400, { error: "Invalid coordinates" });
      const intelligence = await siteIntelligenceService.getIntelligence(lat, lng);
      return sendJson(res, 200, intelligence);
    }

    // Mock facility locations endpoint (backend-ready)
    if (req.method === "GET" && pathname === "/api/locations") {
      const typeFilter = reqUrl.searchParams.get("type") || "";
      const stateFilter = reqUrl.searchParams.get("state") || "";

      const allLocations = [
        { id: "shelter-001", name: "Government School Shelter", type: "shelter", latitude: 12.9716, longitude: 77.5946, capacity: 500, occupied: 320, status: "available", state: "Karnataka", district: "Bengaluru Urban" },
        { id: "shelter-002", name: "Community Hall Relief Shelter", type: "shelter", latitude: 26.1445, longitude: 91.7362, capacity: 300, occupied: 280, status: "near-full", state: "Assam", district: "Kamrup Metropolitan" },
        { id: "shelter-003", name: "Municipal Stadium Shelter", type: "shelter", latitude: 19.0760, longitude: 72.8777, capacity: 1000, occupied: 450, status: "available", state: "Maharashtra", district: "Mumbai" },
        { id: "hospital-001", name: "District General Hospital", type: "hospital", latitude: 12.9352, longitude: 77.6245, capacity: 200, occupied: 145, status: "operational", state: "Karnataka", district: "Bengaluru Urban" },
        { id: "hospital-002", name: "Civil Hospital Guwahati", type: "hospital", latitude: 26.1867, longitude: 91.7460, capacity: 350, occupied: 310, status: "near-full", state: "Assam", district: "Kamrup Metropolitan" },
        { id: "hospital-003", name: "Rajasthan State Hospital", type: "hospital", latitude: 26.9124, longitude: 75.7873, capacity: 400, occupied: 180, status: "operational", state: "Rajasthan", district: "Jaipur" },
        { id: "relief-001", name: "NDRF Relief Center", type: "relief", latitude: 22.5726, longitude: 88.3639, capacity: 800, occupied: 350, status: "active", state: "West Bengal", district: "Kolkata" },
        { id: "relief-002", name: "State Disaster Relief Hub", type: "relief", latitude: 13.0827, longitude: 80.2707, capacity: 600, occupied: 200, status: "active", state: "Tamil Nadu", district: "Chennai" },
        { id: "food-001", name: "Central Food Distribution Point", type: "food", latitude: 28.6139, longitude: 77.2090, capacity: 2000, occupied: 0, status: "active", state: "Delhi", district: "New Delhi" },
        { id: "food-002", name: "Community Kitchen Center", type: "food", latitude: 9.9312, longitude: 76.2673, capacity: 1500, occupied: 0, status: "active", state: "Kerala", district: "Ernakulam" },
        { id: "food-003", name: "Flood Relief Kitchen", type: "food", latitude: 25.6093, longitude: 85.1376, capacity: 1000, occupied: 0, status: "active", state: "Bihar", district: "Patna" },
        { id: "disaster-001", name: "Flood Affected Zone - Brahmaputra", type: "disaster", latitude: 26.7465, longitude: 94.2026, severity: "high", status: "active", state: "Assam", district: "Jorhat" },
        { id: "disaster-002", name: "Cyclone Impact Area", type: "disaster", latitude: 20.2961, longitude: 85.8245, severity: "critical", status: "active", state: "Odisha", district: "Bhubaneswar" },
        { id: "disaster-003", name: "Landslide Warning Zone", type: "disaster", latitude: 30.3165, longitude: 78.0322, severity: "moderate", status: "monitoring", state: "Uttarakhand", district: "Dehradun" },
        { id: "shelter-004", name: "Cyclone Shelter Visakhapatnam", type: "shelter", latitude: 17.6868, longitude: 83.2185, capacity: 700, occupied: 120, status: "available", state: "Andhra Pradesh", district: "Visakhapatnam" }
      ];

      let filtered = allLocations;
      if (typeFilter) filtered = filtered.filter(l => l.type === typeFilter);
      if (stateFilter) filtered = filtered.filter(l => l.state.toLowerCase() === stateFilter.toLowerCase());

      return sendJson(res, 200, { locations: filtered });
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
  server.listen(port, () => {
    console.log(`SHELTR.AI v2.2 running at http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Please kill the existing server and try again.`);
      process.exit(1);
    }
    throw error;
  });
}

listen(START_PORT);
