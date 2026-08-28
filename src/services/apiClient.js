/**
 * Frontend HTTP Client for SHELTR.AI API endpoints.
 */

export const apiClient = {
  async searchLocation(query) {
    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      console.warn("API search error:", e);
      return [];
    }
  },

  async getHourlyClimate(location) {
    try {
      const res = await fetch(`/api/climate/hourly?lat=${location.lat}&lng=${location.lng}&name=${encodeURIComponent(location.name)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("API hourly climate error:", e);
      return null;
    }
  },

  async analyzeDesign(location, siteContext, userOverrides = {}) {
    try {
      const res = await fetch("/api/design/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, siteContext, userOverrides })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("API analyze design error:", e);
      return null;
    }
  },

  async askAssistant(question, context) {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.answer;
    } catch (e) {
      console.warn("API assistant error:", e);
      return "I don't have enough site or climate data to answer that question right now.";
    }
  },

  async generateReport(context) {
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      console.warn("API report error:", e);
      return "Failed to generate HTML report.";
    }
  }
};
