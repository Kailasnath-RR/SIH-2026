const https = require("https");
const locationService = require("./locationService");
const { stateProfiles } = require("../data/stateProfiles");

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

class DemoClimateProvider {
  async getCurrentConditions(location) {
    const state = locationService.findState(location.state) || locationService.findNearestState(location.lat, location.lng);
    const isUrban = /delhi|jaipur|mumbai|guwahati|kochi|bengaluru/i.test(location.name);
    const urbanHeat = isUrban ? 0.8 : 0;

    return {
      temperature: +(state.temperature + urbanHeat).toFixed(1),
      relativeHumidity: state.humidity,
      windSpeed: state.wind,
      rainfall: state.rainfall,
      solarExposure: state.solar,
      climateClassification: state.climate,
      timestamp: new Date().toISOString(),
      source: "Demo regional climate profile",
      dataQuality: "Simulated profile (Fallback)",
      isLive: false,
      elevation: location.elevation ?? state.elevation
    };
  }

  async getHourlyConditions(location) {
    const current = await this.getCurrentConditions(location);
    const hourly = [];
    const baseTemp = current.temperature;
    const baseRH = current.relativeHumidity;
    const baseWind = current.windSpeed;

    for (let h = 0; h < 24; h++) {
      const tempVar = Math.sin((h - 9) / 24 * Math.PI * 2) * 5.2;
      const rhVar = -Math.sin((h - 9) / 24 * Math.PI * 2) * 12;
      const windVar = Math.sin((h - 12) / 24 * Math.PI * 2) * 0.8;
      const solarVal = (h >= 6 && h <= 18) ? Math.max(0, Math.sin((h - 6) / 12 * Math.PI) * (current.solarExposure === "Extreme" ? 950 : current.solarExposure === "High" ? 750 : 500)) : 0;

      hourly.push({
        hour: h,
        label: `${String(h).padStart(2, "0")}:00`,
        temperature: +(baseTemp + tempVar).toFixed(1),
        relativeHumidity: Math.max(10, Math.min(99, +(baseRH + rhVar).toFixed(1))),
        windSpeed: Math.max(0.5, +(baseWind + windVar).toFixed(1)),
        solarRadiation: Math.round(solarVal)
      });
    }

    return {
      locationName: location.name,
      source: "Demo / simulated 24h diurnal curve",
      status: "Simulated",
      hourly
    };
  }
}

class OpenMeteoClimateProvider {
  constructor() {
    this.fallback = new DemoClimateProvider();
    this.stateCache = null;
    this.lastCacheTime = 0;
  }

  /**
   * Batch fetch live Open-Meteo weather for ALL 36 State Centroids in a single HTTP request.
   */
  async fetchAllStatesClimate() {
    const now = Date.now();
    // 15 minute cache TTL
    if (this.stateCache && (now - this.lastCacheTime < 15 * 60 * 1000)) {
      return this.stateCache;
    }

    try {
      const lats = stateProfiles.map(s => s.lat).join(",");
      const lngs = stateProfiles.map(s => s.lng).join(",");
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,shortwave_radiation_instant&timezone=auto`;

      const dataArray = await fetchJson(url);

      if (Array.isArray(dataArray)) {
        const liveStates = stateProfiles.map((state, idx) => {
          const res = dataArray[idx]?.current;
          if (!res) return state;

          const temp = +res.temperature_2m.toFixed(1);
          const rh = Math.round(res.relative_humidity_2m);
          const wind = +(res.wind_speed_10m / 3.6).toFixed(1);
          const precip = res.precipitation || 0;
          const solar = res.shortwave_radiation_instant || 0;

          const rainfallCat = precip > 10 ? "Extreme" : precip > 2 ? "High" : precip > 0.2 ? "Medium" : "Low";
          const solarCat = solar > 750 ? "Extreme" : solar > 450 ? "High" : solar > 200 ? "Medium" : "Low";

          return {
            ...state,
            temperature: temp,
            humidity: rh,
            wind,
            rainfall: rainfallCat,
            solar: solarCat,
            source: "Open-Meteo Live Batch API",
            isLive: true,
            timestamp: new Date().toISOString()
          };
        });

        this.stateCache = liveStates;
        this.lastCacheTime = now;
        console.log("Successfully fetched 36-state live climate batch from Open-Meteo API!");
        return liveStates;
      }
    } catch (e) {
      console.warn("Open-Meteo batch state weather API unreachable, using state fallback:", e.message);
    }

    return stateProfiles.map(s => ({ ...s, source: "Demo regional climate profile", isLive: false }));
  }

  async getCurrentConditions(location) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,shortwave_radiation_instant&timezone=auto`;
      const data = await fetchJson(url);

      if (data && data.current) {
        const cur = data.current;
        const temp = cur.temperature_2m;
        const rh = cur.relative_humidity_2m;
        const wind = +(cur.wind_speed_10m / 3.6).toFixed(1);
        const precip = cur.precipitation || 0;
        const solar = cur.shortwave_radiation_instant || 0;

        const rainfallCat = precip > 10 ? "Extreme" : precip > 2 ? "High" : precip > 0.2 ? "Medium" : "Low";
        const solarCat = solar > 750 ? "Extreme" : solar > 450 ? "High" : solar > 200 ? "Medium" : "Low";
        const state = locationService.findState(location.state) || locationService.findNearestState(location.lat, location.lng);

        return {
          temperature: +temp.toFixed(1),
          relativeHumidity: Math.round(rh),
          windSpeed: wind,
          rainfall: rainfallCat,
          solarExposure: solarCat,
          climateClassification: state ? state.climate : "regional profile",
          timestamp: new Date().toISOString(),
          source: "Open-Meteo Live API",
          dataQuality: "Live observed data",
          isLive: true,
          elevation: data.elevation ?? location.elevation
        };
      }
    } catch (e) {
      console.warn("Open-Meteo API unreachable or offline, falling back to DemoClimateProvider:", e.message);
    }
    return this.fallback.getCurrentConditions(location);
  }

  async getHourlyConditions(location) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,direct_normal_irradiance&forecast_days=1&timezone=auto`;
      const data = await fetchJson(url);

      if (data && data.hourly && data.hourly.time) {
        const hTimes = data.hourly.time;
        const hourly = hTimes.map((tStr, i) => {
          const date = new Date(tStr);
          const h = date.getHours();
          return {
            hour: h,
            label: `${String(h).padStart(2, "0")}:00`,
            temperature: +data.hourly.temperature_2m[i].toFixed(1),
            relativeHumidity: Math.round(data.hourly.relative_humidity_2m[i]),
            windSpeed: +(data.hourly.wind_speed_10m[i] / 3.6).toFixed(1),
            solarRadiation: Math.round(data.hourly.direct_normal_irradiance[i] || 0)
          };
        });

        return {
          locationName: location.name,
          source: "Open-Meteo Hourly API",
          status: "Live Data",
          hourly
        };
      }
    } catch (e) {
      console.warn("Open-Meteo Hourly API unreachable, falling back to demo:", e.message);
    }
    return this.fallback.getHourlyConditions(location);
  }
}

const climateService = new OpenMeteoClimateProvider();

module.exports = climateService;
