/**
 * Site Intelligence Service
 * Aggregates: reverse geocoding + live weather + elevation + nearby facilities + derived insights
 */
const https = require("https");
const http = require("http");
const elevationService = require("./elevationService");

// ── HTTP helpers ──

function fetchJson(url) {
  const mod = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    mod.get(url, { headers: { "User-Agent": "SHELTR-AI/2.2 (disaster-management-platform)" } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

// ── Cache ──

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(lat, lng) {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function getCached(lat, lng) {
  const key = cacheKey(lat, lng);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(lat, lng, data) {
  const key = cacheKey(lat, lng);
  cache.set(key, { data, time: Date.now() });
  // Evict old entries
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ── Nominatim rate limiter (max 1 req/sec per policy) ──

let lastNominatimCall = 0;

async function reverseGeocode(lat, lng) {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNominatimCall = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;
    const data = await fetchJson(url);
    if (data && data.address) {
      const a = data.address;
      return {
        name: a.city || a.town || a.village || a.hamlet || a.suburb || a.county || data.name || "Unknown",
        city: a.city || a.town || a.village || a.hamlet || null,
        district: a.county || a.state_district || a.suburb || null,
        state: a.state || null,
        country: a.country || null,
        postcode: a.postcode || null,
        displayName: data.display_name || null,
        source: "Nominatim (OpenStreetMap)"
      };
    }
  } catch (e) {
    console.warn("Nominatim reverse geocoding failed:", e.message);
  }
  return {
    name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    city: null, district: null, state: null, country: null, postcode: null,
    displayName: null, source: "Coordinates only (geocoding unavailable)"
  };
}

// ── Open-Meteo Weather ──

async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
    const data = await fetchJson(url);
    if (data && data.current) {
      const c = data.current;
      return {
        temperature: c.temperature_2m,
        apparentTemperature: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        precipitation: c.precipitation || 0,
        rain: c.rain || 0,
        weatherCode: c.weather_code,
        cloudCover: c.cloud_cover,
        pressure: c.surface_pressure,
        windSpeed: +(c.wind_speed_10m).toFixed(1),
        windDirection: c.wind_direction_10m,
        timezone: data.timezone || "Unknown",
        utcOffset: data.utc_offset_seconds || 0,
        condition: weatherCodeToText(c.weather_code),
        source: "Open-Meteo Live API",
        isLive: true,
        timestamp: new Date().toISOString()
      };
    }
  } catch (e) {
    console.warn("Open-Meteo weather fetch failed:", e.message);
  }
  return {
    temperature: null, apparentTemperature: null, humidity: null,
    precipitation: null, rain: null, weatherCode: null, cloudCover: null,
    pressure: null, windSpeed: null, windDirection: null,
    timezone: "Unknown", condition: "Unavailable",
    source: "Weather data temporarily unavailable", isLive: false,
    timestamp: new Date().toISOString()
  };
}

function weatherCodeToText(code) {
  if (code == null) return "Unknown";
  const map = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
    77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
    82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
  };
  return map[code] || `Weather code ${code}`;
}

// ── Nearby Facilities ──

const FACILITY_DB = [
  { id: "shelter-001", name: "Government School Shelter", type: "shelter", latitude: 12.9716, longitude: 77.5946, capacity: 500, occupied: 320, status: "available", state: "Karnataka" },
  { id: "shelter-002", name: "Community Hall Relief Shelter", type: "shelter", latitude: 26.1445, longitude: 91.7362, capacity: 300, occupied: 280, status: "near-full", state: "Assam" },
  { id: "shelter-003", name: "Municipal Stadium Shelter", type: "shelter", latitude: 19.0760, longitude: 72.8777, capacity: 1000, occupied: 450, status: "available", state: "Maharashtra" },
  { id: "hospital-001", name: "District General Hospital", type: "hospital", latitude: 12.9352, longitude: 77.6245, capacity: 200, occupied: 145, status: "operational", state: "Karnataka" },
  { id: "hospital-002", name: "Civil Hospital Guwahati", type: "hospital", latitude: 26.1867, longitude: 91.7460, capacity: 350, occupied: 310, status: "near-full", state: "Assam" },
  { id: "hospital-003", name: "Rajasthan State Hospital", type: "hospital", latitude: 26.9124, longitude: 75.7873, capacity: 400, occupied: 180, status: "operational", state: "Rajasthan" },
  { id: "relief-001", name: "NDRF Relief Center", type: "relief", latitude: 22.5726, longitude: 88.3639, capacity: 800, occupied: 350, status: "active", state: "West Bengal" },
  { id: "relief-002", name: "State Disaster Relief Hub", type: "relief", latitude: 13.0827, longitude: 80.2707, capacity: 600, occupied: 200, status: "active", state: "Tamil Nadu" },
  { id: "food-001", name: "Central Food Distribution Point", type: "food", latitude: 28.6139, longitude: 77.2090, capacity: 2000, occupied: 0, status: "active", state: "Delhi" },
  { id: "food-002", name: "Community Kitchen Center", type: "food", latitude: 9.9312, longitude: 76.2673, capacity: 1500, occupied: 0, status: "active", state: "Kerala" },
  { id: "food-003", name: "Flood Relief Kitchen", type: "food", latitude: 25.6093, longitude: 85.1376, capacity: 1000, occupied: 0, status: "active", state: "Bihar" },
  { id: "shelter-004", name: "Cyclone Shelter Visakhapatnam", type: "shelter", latitude: 17.6868, longitude: 83.2185, capacity: 700, occupied: 120, status: "available", state: "Andhra Pradesh" }
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearbyFacilities(lat, lng, radiusKm = 100) {
  const results = { shelters: [], hospitals: [], reliefCenters: [], foodCenters: [] };
  const typeMap = { shelter: "shelters", hospital: "hospitals", relief: "reliefCenters", food: "foodCenters" };

  for (const f of FACILITY_DB) {
    const dist = haversineKm(lat, lng, f.latitude, f.longitude);
    if (dist <= radiusKm) {
      const key = typeMap[f.type];
      if (key) {
        results[key].push({
          ...f,
          distanceKm: +dist.toFixed(1),
          available: f.capacity && f.occupied != null ? f.capacity - f.occupied : null
        });
      }
    }
  }

  // Sort each by distance
  for (const key of Object.keys(results)) {
    results[key].sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return results;
}

function findRecommendedShelter(nearby) {
  const allShelters = nearby.shelters.filter(s =>
    s.status === "available" && s.available && s.available > 0
  );
  if (allShelters.length === 0) return null;
  // Best = closest with most availability
  return allShelters[0];
}

// ── Derived Insights ──

function deriveInsights(weather, elevation) {
  const insights = {};

  if (weather.temperature != null) {
    // Heat stress
    if (weather.temperature >= 42) insights.heatStress = "Extreme";
    else if (weather.temperature >= 37) insights.heatStress = "High";
    else if (weather.temperature >= 30) insights.heatStress = "Moderate";
    else if (weather.temperature >= 20) insights.heatStress = "Low";
    else insights.heatStress = "None";

    // Climate profile estimation
    if (weather.humidity != null) {
      if (weather.temperature > 28 && weather.humidity > 70) insights.climateProfile = "Tropical humid";
      else if (weather.temperature > 28 && weather.humidity < 40) insights.climateProfile = "Hot arid";
      else if (weather.temperature > 25 && weather.humidity > 50) insights.climateProfile = "Tropical wet-dry";
      else if (weather.temperature < 15) insights.climateProfile = "Temperate / cool";
      else insights.climateProfile = "Subtropical";
    }
  }

  // Rainfall condition
  if (weather.precipitation != null) {
    if (weather.precipitation > 20) insights.rainfallCondition = "Heavy rainfall";
    else if (weather.precipitation > 5) insights.rainfallCondition = "Moderate rainfall";
    else if (weather.precipitation > 0.5) insights.rainfallCondition = "Light rainfall";
    else insights.rainfallCondition = "No significant rainfall";
  }

  // Flood risk estimation (derived, not authoritative)
  if (weather.precipitation != null && elevation != null) {
    let risk = "Low";
    if (weather.precipitation > 20 && elevation < 50) risk = "High (Estimated)";
    else if (weather.precipitation > 10 && elevation < 100) risk = "Moderate (Estimated)";
    else if (weather.precipitation > 5) risk = "Low-Moderate (Estimated)";
    insights.floodRisk = risk;
    insights.floodRiskSource = "Derived from current precipitation + elevation. Not an official flood warning.";
  }

  insights.source = "Calculated from live weather data";
  return insights;
}

// ── Main Orchestrator ──

const siteIntelligenceService = {
  async getIntelligence(lat, lng) {
    // Check cache first
    const cached = getCached(lat, lng);
    if (cached) return { ...cached, fromCache: true };

    // Parallel fetch: reverse geocode + weather + elevation
    const [address, weather, elevData] = await Promise.all([
      reverseGeocode(lat, lng),
      fetchWeather(lat, lng),
      elevationService.getElevation(lat, lng)
    ]);

    const elevation = elevData.elevation;
    const nearby = findNearbyFacilities(lat, lng, 100);
    const recommended = findRecommendedShelter(nearby);
    const insights = deriveInsights(weather, elevation);

    const result = {
      coordinates: { latitude: +lat.toFixed(6), longitude: +lng.toFixed(6) },
      address,
      environment: {
        temperature: weather.temperature,
        apparentTemperature: weather.apparentTemperature,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        cloudCover: weather.cloudCover,
        pressure: weather.pressure,
        weatherCode: weather.weatherCode,
        condition: weather.condition,
        elevation,
        elevationSource: elevData.source,
        timezone: weather.timezone,
        weatherSource: weather.source,
        isLive: weather.isLive,
        timestamp: weather.timestamp
      },
      climate: {
        profile: insights.climateProfile || "Not determined",
        heatStress: insights.heatStress || "Not determined",
        rainfallCondition: insights.rainfallCondition || "Not determined",
        floodRisk: insights.floodRisk || "Not determined",
        floodRiskSource: insights.floodRiskSource || null,
        source: insights.source
      },
      disaster: {
        floodRisk: insights.floodRisk || "Not determined",
        alerts: "Live disaster alert data unavailable — no authoritative source integrated yet",
        alertSource: "Placeholder — connect NDMA/IMD API for real alerts"
      },
      nearby: {
        shelters: nearby.shelters,
        hospitals: nearby.hospitals,
        reliefCenters: nearby.reliefCenters,
        foodCenters: nearby.foodCenters,
        totalNearby: nearby.shelters.length + nearby.hospitals.length + nearby.reliefCenters.length + nearby.foodCenters.length
      },
      recommendedShelter: recommended,
      fromCache: false
    };

    setCache(lat, lng, result);
    return result;
  }
};

module.exports = siteIntelligenceService;
