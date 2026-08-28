import { appState } from "../core/state.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function renderSiteContextInputs() {
  const container = $("siteContextPanel");
  if (!container) return;

  container.innerHTML = `
    <div class="site-context-card glass">
      <h3>Site Context Factors</h3>
      <p class="context-desc">Site topography, exposure, and water risk modify physical design rules.</p>
      
      <div class="site-grid">
        <label>Terrain
          <select id="terrainInput">
            <option value="Flat"${appState.siteContext.terrain === "Flat" ? " selected" : ""}>Flat Ground</option>
            <option value="Sloped"${appState.siteContext.terrain === "Sloped" ? " selected" : ""}>Sloped / Hillside</option>
            <option value="Mountain"${appState.siteContext.terrain === "Mountain" ? " selected" : ""}>Mountain Ridge</option>
            <option value="Coastal"${appState.siteContext.terrain === "Coastal" ? " selected" : ""}>Coastal Shore</option>
            <option value="Flood-prone"${appState.siteContext.terrain === "Flood-prone" ? " selected" : ""}>Flood-prone Lowland</option>
          </select>
        </label>

        <label>Site Exposure
          <select id="exposureInput">
            <option value="Open"${appState.siteContext.exposure === "Open" ? " selected" : ""}>Open Unshaded</option>
            <option value="Partially sheltered"${appState.siteContext.exposure === "Partially sheltered" ? " selected" : ""}>Partially Sheltered</option>
            <option value="Urban"${appState.siteContext.exposure === "Urban" ? " selected" : ""}>Urban Canopy</option>
            <option value="Forested"${appState.siteContext.exposure === "Forested" ? " selected" : ""}>Forested Canopy</option>
          </select>
        </label>

        <label>Water / Flood Risk
          <select id="waterRiskInput">
            <option value="Low"${appState.siteContext.waterRisk === "Low" ? " selected" : ""}>Low Ground Water</option>
            <option value="Medium"${appState.siteContext.waterRisk === "Medium" ? " selected" : ""}>Medium Moisture</option>
            <option value="High"${appState.siteContext.waterRisk === "High" ? " selected" : ""}>High Flood / Water</option>
          </select>
        </label>

        <label>Wind Exposure
          <select id="windExposureInput">
            <option value="Low"${appState.siteContext.windExposure === "Low" ? " selected" : ""}>Low (Sheltered)</option>
            <option value="Medium"${appState.siteContext.windExposure === "Medium" ? " selected" : ""}>Medium Breeze</option>
            <option value="High"${appState.siteContext.windExposure === "High" ? " selected" : ""}>High Wind Corridor</option>
          </select>
        </label>
      </div>
    </div>
  `;

  // Bind change events
  ["terrainInput", "exposureInput", "waterRiskInput", "windExposureInput"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", async (e) => {
      const key = id.replace("Input", "");
      appState.siteContext[key] = e.target.value;

      // Re-trigger analysis
      if (appState.selectedLocation) {
        const { analyzeCurrentLocation } = await import("../app.js");
        analyzeCurrentLocation();
      }
    });
  });
}
