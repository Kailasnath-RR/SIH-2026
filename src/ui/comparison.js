import { appState } from "../core/state.js";
import { demoCities } from "../core/constants.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function populateComparisonOptions() {
  const compA = $("compareA");
  const compB = $("compareB");
  if (!compA || !compB) return;

  compA.innerHTML = demoCities.map(c => `<option value="${c.name}"${c.name === "Guwahati" ? " selected" : ""}>${c.name} (${c.state})</option>`).join("");
  compB.innerHTML = demoCities.map(c => `<option value="${c.name}"${c.name === "Jaipur" ? " selected" : ""}>${c.name} (${c.state})</option>`).join("");

  compA.addEventListener("change", renderComparison);
  compB.addEventListener("change", renderComparison);

  renderComparison();
}

export async function renderComparison() {
  const container = $("compareOutput");
  if (!container) return;

  const locAName = $("compareA")?.value || "Guwahati";
  const locBName = $("compareB")?.value || "Jaipur";

  const locA = demoCities.find(c => c.name === locAName) || demoCities[0];
  const locB = demoCities.find(c => c.name === locBName) || demoCities[3];

  const resA = await apiClient.analyzeDesign(locA, appState.siteContext);
  const resB = await apiClient.analyzeDesign(locB, appState.siteContext);

  if (!resA || !resB) {
    container.innerHTML = "<div>Analyzing locations for comparison...</div>";
    return;
  }

  const aA = resA.analysis; const dA = resA.design;
  const aB = resB.analysis; const dB = resB.design;

  container.innerHTML = `
    <div class="comparison-table-wrapper glass">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric / Parameter</th>
            <th>${locA.name} (${locA.state})</th>
            <th>${locB.name} (${locB.state})</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Air Temperature</strong></td><td>${aA.env.temperature}°C</td><td>${aB.env.temperature}°C</td></tr>
          <tr><td><strong>Relative Humidity</strong></td><td>${aA.env.relativeHumidity}%</td><td>${aB.env.relativeHumidity}%</td></tr>
          <tr><td><strong>Rainfall Exposure</strong></td><td>${aA.env.rainfall}</td><td>${aB.env.rainfall}</td></tr>
          <tr><td><strong>Solar Exposure</strong></td><td>${aA.env.solarExposure}</td><td>${aB.env.solarExposure}</td></tr>
          <tr><td><strong>Thermal Comfort Score</strong></td><td><strong>${aA.comfortScore}/100</strong> (${aA.stressBand})</td><td><strong>${aB.comfortScore}/100</strong> (${aB.stressBand})</td></tr>
          <tr><td><strong>Recommended Roof</strong></td><td>${dA.params.roofType.value}</td><td>${dB.params.roofType.value}</td></tr>
          <tr><td><strong>Ventilation Strategy</strong></td><td>${dA.params.ventilation.value}</td><td>${dB.params.ventilation.value}</td></tr>
          <tr><td><strong>Opening Dimensions</strong></td><td>${dA.params.openings.value}</td><td>${dB.params.openings.value}</td></tr>
          <tr><td><strong>Shading System</strong></td><td>${dA.params.shading.value}</td><td>${dB.params.shading.value}</td></tr>
          <tr><td><strong>Raised Floor</strong></td><td>${dA.params.raisedFloor.value ? "Yes (Elevated)" : "No (Slab)"}</td><td>${dB.params.raisedFloor.value ? "Yes (Elevated)" : "No (Slab)"}</td></tr>
          <tr><td><strong>Primary Material</strong></td><td>${dA.params.material.value}</td><td>${dB.params.material.value}</td></tr>
          <tr><td><strong>Adaptation Score</strong></td><td><strong class="total-score-num">${dA.totalScore}/100</strong></td><td><strong class="total-score-num">${dB.totalScore}/100</strong></td></tr>
        </tbody>
      </table>
    </div>

    <div class="why-different-card glass">
      <h4>Why Are They Different?</h4>
      <p>
        <strong>${locA.name}</strong> experiences high humidity and rainfall, triggering high cross-ventilation, large openings, sloped roof drainage, and raised stilts for flood protection.<br>
        <strong>${locB.name}</strong> operates under hot-dry desert conditions with high solar radiation, triggering thermal mass, controlled small openings, deep eave shading, and reflective double roofs to block direct sun.
      </p>
    </div>
  `;
}
