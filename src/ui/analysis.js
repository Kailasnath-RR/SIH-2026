import { appState } from "../core/state.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function renderAnalysis() {
  const a = appState.analysis;
  if (!a) return;

  $("thermalScore").textContent = `${a.comfortScore} / 100`;
  $("thermalBand").textContent = `${a.stressBand} thermal stress`;
  
  if (appState.design) {
    $("designScore").textContent = `${appState.design.totalScore} / 100`;
    $("shelterType").textContent = `${appState.design.params.roofType.value} climate-adapted shelter`;
  }
  
  $("dataQuality").textContent = a.confidence || a.env.dataQuality;

  // Environmental Cards with Data Provenance Badges
  const envCardsEl = $("envCards");
  if (envCardsEl) {
    const cards = [
      ["Air Temperature", `${a.env.temperature}°C`, a.env.source, "Observed/Profile"],
      ["Relative Humidity", `${a.env.relativeHumidity}%`, a.env.source, "Observed/Profile"],
      ["Wind Speed", `${a.env.windSpeed} m/s`, a.env.source, "Observed/Profile"],
      ["Rainfall Risk", a.env.rainfall, "Climate Classification", "Derived Risk"],
      ["Solar Exposure", a.env.solarExposure, "Radiant Load Profile", "Derived Risk"],
      ["Steadman Heat Index", `${a.heatIndex}°C`, "Engineering Formula", "Calculated Metric"]
    ];

    envCardsEl.innerHTML = cards.map(c => `
      <article class="env-card glass">
        <span>${c[0]}</span>
        <strong>${c[1]}</strong>
        <span class="prov-badge">${c[2]}</span>
        <em>${c[3]}</em>
      </article>
    `).join("");
  }

  // Render Component Score Breakdown (Thermal Comfort 5-factor breakdown)
  renderComfortBreakdown(a);

  // Render Expandable Assumptions Accordion
  renderAssumptions(a);

  // Render 24-Hour Climate Graph
  drawClimateChart();
}

function renderComfortBreakdown(a) {
  const container = $("comfortBreakdown");
  if (!container || !a.componentScores) return;

  const comps = Object.values(a.componentScores);
  container.innerHTML = `
    <h3>Thermal Comfort Score Breakdown (${a.comfortScore}/100)</h3>
    <p class="heuristic-note">Prototype heuristic model — NOT certified ASHRAE-55 / ISO-7730 engineering calculation.</p>
    <div class="component-grid">
      ${comps.map(c => `
        <div class="comp-row">
          <div class="comp-header">
            <strong>${c.label}: ${c.val}</strong>
            <span class="comp-score">${c.score}/100</span>
          </div>
          <div class="comp-bar-track">
            <div class="comp-bar-fill" style="width: ${c.score}%; background: ${c.score > 70 ? 'var(--cyan)' : c.score > 40 ? 'var(--amber)' : 'var(--rose)'};"></div>
          </div>
          <span class="comp-impact">${c.impact}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAssumptions(a) {
  const container = $("assumptionsPanel");
  if (!container || !a.assumptions) return;

  const asm = a.assumptions;
  container.innerHTML = `
    <details class="assumptions-accordion glass">
      <summary><strong>Assumptions & Calculation Method</strong> <span>(Click to inspect parameters & limitations)</span></summary>
      <div class="assumptions-content">
        <div><strong>Activity Level:</strong> ${asm.activity}</div>
        <div><strong>Clothing Insulation:</strong> ${asm.clothing}</div>
        <div><strong>Shelter Target:</strong> ${asm.shelter}</div>
        <div><strong>Calculation Method:</strong> ${asm.calculationMethod}</div>
        <div class="limitation-warning"><strong>Limitations:</strong> ${asm.limitations}</div>
      </div>
    </details>
  `;
}

export async function drawClimateChart() {
  const canvas = $("climateChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const a = appState.analysis;
  if (!a) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fetch hourly data from API if available
  const hourlyData = await apiClient.getHourlyClimate(appState.selectedLocation || { lat: 26.14, lng: 91.73, name: "Guwahati" });
  const hourly = hourlyData?.hourly || [];

  // Update Status Banner above Chart
  const statusEl = $("chartStatus");
  if (statusEl) {
    statusEl.innerHTML = `Source: <strong>${hourlyData?.source || a.env.source}</strong> | Status: <span class="badge ${hourlyData?.status === 'Live Data' ? 'badge-success' : 'badge-warning'}">${hourlyData?.status || 'Simulated'}</span>`;
  }

  // Draw Grid Lines
  ctx.strokeStyle = "rgba(141,232,218,.14)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(50, 34 + i * 45);
    ctx.lineTo(860, 34 + i * 45);
    ctx.stroke();
  }

  if (hourly.length === 24) {
    // Plot temperature series
    ctx.strokeStyle = "#ff6b8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    hourly.forEach((h, i) => {
      const x = 50 + i * 35;
      const y = 310 - (h.temperature * 5.2 - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Plot humidity series
    ctx.strokeStyle = "#55e5d3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    hourly.forEach((h, i) => {
      const x = 50 + i * 35;
      const y = 310 - (h.relativeHumidity * 2.2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Plot solar radiation series
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.beginPath();
    hourly.forEach((h, i) => {
      const x = 50 + i * 35;
      const y = 310 - (h.solarRadiation / 4);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Legend
  ctx.fillStyle = "#ff6b8f"; ctx.fillText("Air Temp (°C)", 64, 28);
  ctx.fillStyle = "#55e5d3"; ctx.fillText("Humidity (%)", 200, 28);
  ctx.fillStyle = "#ffd166"; ctx.fillText("Solar Radiation (W/m²)", 330, 28);
}
