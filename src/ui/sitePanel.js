import { appState } from "../core/state.js";
import { updateShelterGeometry } from "./studio.js";

const $ = (id) => document.getElementById(id);

export function renderSiteIntelligenceLoading(lat, lng) {
  const container = $("siteIntelligenceContent");
  if (!container) return;
  
  if ($("navLocation")) $("navLocation").textContent = "Selected Location";
  if ($("selectedName")) $("selectedName").textContent = "Fetching...";

  container.innerHTML = `
    <div class="site-meta" style="opacity: 0.6;">
      <div><dt>Status</dt><dd>Fetching location data...</dd></div>
      <div><dt>Coordinates</dt><dd>${lat.toFixed(4)}, ${lng.toFixed(4)}</dd></div>
    </div>
    <div class="si-section si-loading-pulse" style="margin-top: 1rem; border: 1px solid var(--line); padding: 1rem;">
      <div style="height: 12px; background: rgba(255,255,255,0.1); margin-bottom: 8px; width: 80%;"></div>
      <div style="height: 12px; background: rgba(255,255,255,0.1); margin-bottom: 8px; width: 60%;"></div>
      <div style="height: 12px; background: rgba(255,255,255,0.1); margin-bottom: 8px; width: 90%;"></div>
    </div>
  `;
}

export function renderSiteIntelligence(data) {
  const container = $("siteIntelligenceContent");
  if (!container) return;

  const locName = data.address.name || "Unknown Location";
  if ($("selectedName")) $("selectedName").textContent = locName;
  if ($("navLocation")) {
    const parts = ["India"];
    if (data.address.state) parts.push(data.address.state);
    parts.push(locName);
    $("navLocation").textContent = parts.join(" → ");
  }

  // 1. Location & Environment
  let html = `
    <dl class="site-meta">
      <div><dt>State / Region</dt><dd>${data.address.state || "-"}</dd></div>
      <div><dt>District</dt><dd>${data.address.district || "-"}</dd></div>
      <div><dt>Latitude</dt><dd>${data.coordinates.latitude}</dd></div>
      <div><dt>Longitude</dt><dd>${data.coordinates.longitude}</dd></div>
      <div><dt>Elevation</dt><dd>${data.environment.elevation != null ? data.environment.elevation + " m" : "Unknown"}</dd></div>
      <div><dt>Timezone</dt><dd>${data.environment.timezone || "Unknown"}</dd></div>
    </dl>
  `;

  // 2. Current Conditions
  const env = data.environment;
  if (env.temperature != null) {
    html += `
      <div class="si-section">
        <h4 class="si-header">CURRENT CONDITIONS</h4>
        <div class="si-grid-3">
          <div class="si-card"><span class="si-val">${env.temperature}°C</span><span class="si-lbl">Temp</span></div>
          <div class="si-card"><span class="si-val">${env.apparentTemperature}°C</span><span class="si-lbl">Feels Like</span></div>
          <div class="si-card"><span class="si-val">${env.humidity}%</span><span class="si-lbl">Humidity</span></div>
          <div class="si-card"><span class="si-val">${env.precipitation} mm</span><span class="si-lbl">Rainfall</span></div>
          <div class="si-card"><span class="si-val">${env.windSpeed}</span><span class="si-lbl">Wind km/h</span></div>
          <div class="si-card"><span class="si-val" style="font-size: 0.8rem; line-height: 1.2;">${env.condition}</span><span class="si-lbl">Condition</span></div>
        </div>
        <div class="si-source">Source: ${env.weatherSource}</div>
      </div>
    `;
  } else {
    html += `
      <div class="si-section">
        <h4 class="si-header">CURRENT CONDITIONS</h4>
        <p class="si-text">Live weather data temporarily unavailable.</p>
      </div>
    `;
  }

  // 3. Climate & Disaster Intelligence
  const clim = data.climate;
  const dis = data.disaster;
  html += `
    <div class="si-section">
      <h4 class="si-header">CLIMATE & RISK PROFILE</h4>
      <div class="si-row"><span>Climate Zone</span><strong>${clim.profile}</strong></div>
      <div class="si-row"><span>Heat Stress</span><strong>${clim.heatStress}</strong></div>
      <div class="si-row"><span>Rainfall Condition</span><strong>${clim.rainfallCondition}</strong></div>
      <div class="si-row">
        <span>Flood Risk</span>
        <strong style="color: ${dis.floodRisk.includes("High") ? 'var(--rose)' : 'var(--amber)'};">${dis.floodRisk}</strong>
      </div>
      <div class="si-row" style="flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 6px;">
        <span>Active Alerts</span>
        <strong style="color: var(--muted); font-weight: normal;">${dis.alerts}</strong>
      </div>
    </div>
  `;

  // 4. Nearby Resources
  const nb = data.nearby;
  html += `
    <div class="si-section">
      <h4 class="si-header">NEARBY RESOURCES (100km radius)</h4>
      <div class="si-grid-4">
        <div class="si-stat"><strong>${nb.shelters.length}</strong><span>Shelters</span></div>
        <div class="si-stat"><strong>${nb.hospitals.length}</strong><span>Hospitals</span></div>
        <div class="si-stat"><strong>${nb.reliefCenters.length}</strong><span>Relief</span></div>
        <div class="si-stat"><strong>${nb.foodCenters.length}</strong><span>Food</span></div>
      </div>
    </div>
  `;

  // 5. Recommended Shelter
  const rec = data.recommendedShelter;
  if (rec) {
    html += `
      <div class="si-section">
        <h4 class="si-header" style="color: var(--cyan);">RECOMMENDED SHELTER</h4>
        <div class="si-card-large">
          <strong>${rec.name}</strong>
          <div class="si-row"><span>Distance</span><strong>${rec.distanceKm} km</strong></div>
          <div class="si-row"><span>Available spaces</span><strong>${rec.available}</strong></div>
          <div class="si-row"><span>Status</span><strong style="color: var(--green);">${rec.status.toUpperCase()}</strong></div>
        </div>
      </div>
    `;
  } else if (nb.totalNearby > 0) {
    html += `
      <div class="si-section">
        <h4 class="si-header">RECOMMENDED SHELTER</h4>
        <p class="si-text">No nearby shelters have available capacity.</p>
      </div>
    `;
  }

  container.innerHTML = html;
  
  if ($("analyzeButton")) {
    $("analyzeButton").disabled = false;
  }

  // Update app state
  appState.selectedLocation = {
    name: locName,
    state: data.address.state,
    district: data.address.district,
    lat: data.coordinates.latitude,
    lng: data.coordinates.longitude,
    elevation: data.environment.elevation,
    dataType: "Site-specific intelligence",
    confidence: "High (Exact coordinates)",
    isCustom: true
  };
}

export function renderSiteIntelligenceError(lat, lng, error) {
  const container = $("siteIntelligenceContent");
  if (!container) return;
  
  if ($("selectedName")) $("selectedName").textContent = "Location Error";
  
  container.innerHTML = `
    <dl class="site-meta">
      <div><dt>Coordinates</dt><dd>${lat.toFixed(4)}, ${lng.toFixed(4)}</dd></div>
    </dl>
    <div class="si-section">
      <h4 class="si-header" style="color: var(--rose);">DATA UNAVAILABLE</h4>
      <p class="si-text">Failed to fetch site intelligence: ${error.message}</p>
      <p class="si-text" style="color: var(--muted); margin-top: 0.5rem;">The application is continuing with limited data.</p>
    </div>
  `;
}
