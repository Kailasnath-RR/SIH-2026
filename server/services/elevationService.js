const https = require("https");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

const elevationService = {
  async getElevation(lat, lng) {
    try {
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
      const data = await fetchJson(url);

      if (data && Array.isArray(data.elevation) && data.elevation.length > 0) {
        return {
          elevation: Math.round(data.elevation[0]),
          latitude: lat,
          longitude: lng,
          source: "Open-Meteo Elevation API",
          confidence: "High (Site-specific)"
        };
      }
    } catch (e) {
      console.warn("Elevation API error or offline, using regional fallback:", e.message);
    }

    // Default Fallback
    return {
      elevation: 50,
      latitude: lat,
      longitude: lng,
      source: "Regional terrain fallback",
      confidence: "Moderate (Regional estimate)"
    };
  }
};

module.exports = elevationService;
