const reportService = {
  generateHtmlReport(context) {
    const loc = context.location || { name: "Unknown", state: "India", lat: 0, lng: 0, elevation: 0, dataType: "Demo" };
    const a = context.analysis || { comfortScore: 70, stressBand: "Moderate", heatIndex: 30, env: {}, componentScores: {}, assumptions: {} };
    const d = context.design || { params: {}, breakdown: { categories: {} }, totalScore: 75 };
    const site = context.siteContext || { terrain: "Flat", exposure: "Open", waterRisk: "Low", windExposure: "Low" };
    const env = a.env || {};
    const params = d.params || {};
    const cat = (d.breakdown && d.breakdown.categories) || {};

    const timestamp = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SHELTR.AI | Conceptual Climate-Adaptive Design Report - ${loc.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; color: #1a242c; background: #fff; line-height: 1.6; }
    .header { border-bottom: 3px solid #0f2c3d; padding-bottom: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 1.8rem; font-weight: 800; color: #0f2c3d; letter-spacing: -0.03em; }
    .brand span { color: #00a896; }
    .title { font-size: 1.2rem; font-weight: 600; color: #4a5568; margin-top: 0.2rem; }
    .meta-box { background: #f7fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px; margin-bottom: 2rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .meta-item dt { font-size: 0.75rem; text-transform: uppercase; color: #718096; font-weight: 700; }
    .meta-item dd { margin: 0.2rem 0 0; font-size: 0.95rem; font-weight: 600; color: #2d3748; }
    h2 { font-size: 1.25rem; color: #0f2c3d; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
    th { background: #edf2f7; font-weight: 700; color: #2d3748; }
    .provenance-tag { font-size: 0.75rem; background: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-block; }
    .score-badge { display: inline-block; background: #0f2c3d; color: #fff; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 1.1rem; }
    .assumptions, .limitations { background: #fffaf0; border-left: 4px solid #dd6b20; padding: 1rem; margin: 1.5rem 0; font-size: 0.88rem; }
    .limitations { background: #fff5f5; border-left-color: #e53e3e; }
    .footer { border-top: 1px solid #e2e8f0; margin-top: 3rem; padding-top: 1rem; text-align: center; font-size: 0.8rem; color: #718096; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SHELTR<span>.AI</span></div>
      <div class="title">Conceptual Climate-Adaptive Design Report</div>
    </div>
    <div style="text-align: right; font-size: 0.85rem; color: #718096;">
      Generated: ${timestamp}<br>
      Report ID: SH-RE-${Math.floor(100000 + Math.random() * 900000)}
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item"><dt>Location</dt><dd>${loc.name}, ${loc.state}</dd></div>
    <div class="meta-item"><dt>Coordinates</dt><dd>${loc.lat}° N, ${loc.lng}° E</dd></div>
    <div class="meta-item"><dt>Elevation</dt><dd>${loc.elevation} m</dd></div>
    <div class="meta-item"><dt>Data Provenance</dt><dd><span class="provenance-tag">${loc.dataType || "Regional estimate"}</span></dd></div>
  </div>

  <h2>1. Environmental Conditions & Data Provenance</h2>
  <table>
    <thead>
      <tr><th>Parameter</th><th>Value</th><th>Source</th><th>Confidence / Data Quality</th></tr>
    </thead>
    <tbody>
      <tr><td>Air Temperature</td><td>${env.temperature}°C</td><td>${env.source || "Demo profile"}</td><td>${env.dataQuality || "Moderate"}</td></tr>
      <tr><td>Relative Humidity</td><td>${env.relativeHumidity}%</td><td>${env.source || "Demo profile"}</td><td>${env.dataQuality || "Moderate"}</td></tr>
      <tr><td>Wind Speed</td><td>${env.windSpeed} m/s</td><td>${env.source || "Demo profile"}</td><td>${env.dataQuality || "Moderate"}</td></tr>
      <tr><td>Rainfall Risk</td><td>${env.rainfall}</td><td>${env.source || "Demo profile"}</td><td>${env.dataQuality || "Moderate"}</td></tr>
      <tr><td>Solar Exposure</td><td>${env.solarExposure}</td><td>${env.source || "Demo profile"}</td><td>${env.dataQuality || "Moderate"}</td></tr>
      <tr><td>Steadman Heat Index</td><td>${a.heatIndex}°C</td><td>Calculated metric</td><td>Engineering Formula</td></tr>
    </tbody>
  </table>

  <h2>2. Environmental Comfort & Stress Analysis</h2>
  <p><strong>Thermal Comfort Score:</strong> <span class="score-badge">${a.comfortScore} / 100</span> (${a.stressBand} thermal stress band)</p>

  <div class="assumptions">
    <strong>Calculation Assumptions:</strong>
    <ul>
      <li><strong>Activity level:</strong> ${a.assumptions?.activity || "Seated light activity"}</li>
      <li><strong>Clothing insulation:</strong> ${a.assumptions?.clothing || "Light summer attire"}</li>
      <li><strong>Shelter target:</strong> ${a.assumptions?.shelter || "Unconditioned shaded natural structure"}</li>
      <li><strong>Calculation method:</strong> ${a.assumptions?.calculationMethod || "Steadman Heat Index + solar/wind modifiers"}</li>
    </ul>
  </div>

  <h2>3. Site Context Factors</h2>
  <table>
    <tr><th>Terrain</th><td>${site.terrain}</td><th>Site Exposure</th><td>${site.exposure}</td></tr>
    <tr><th>Water Risk</th><td>${site.waterRisk}</td><th>Wind Exposure</th><td>${site.windExposure}</td></tr>
  </table>

  <h2>4. Climate-Adaptive Design Recommendations</h2>
  <table>
    <thead>
      <tr><th>Element</th><th>Recommendation</th><th>Climate Trigger</th><th>Physical Reasoning & Expected Benefit</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Roof Type</strong></td><td>${params.roofType?.value || "Sloped"}</td><td>${params.roofType?.trigger || "Rainfall"}</td><td>${params.roofType?.reason || ""} (${params.roofType?.expectedBenefit || ""})</td></tr>
      <tr><td><strong>Ventilation</strong></td><td>${params.ventilation?.value || "High"}</td><td>${params.ventilation?.trigger || "Humidity"}</td><td>${params.ventilation?.reason || ""} (${params.ventilation?.expectedBenefit || ""})</td></tr>
      <tr><td><strong>Openings</strong></td><td>${params.openings?.value || "Large"}</td><td>${params.openings?.trigger || "Airflow"}</td><td>${params.openings?.reason || ""} (${params.openings?.expectedBenefit || ""})</td></tr>
      <tr><td><strong>Shading</strong></td><td>${params.shading?.value || "High"}</td><td>${params.shading?.trigger || "Solar"}</td><td>${params.shading?.reason || ""} (${params.shading?.expectedBenefit || ""})</td></tr>
      <tr><td><strong>Raised Floor</strong></td><td>${params.raisedFloor?.value ? "Yes" : "No"}</td><td>${params.raisedFloor?.trigger || "Moisture"}</td><td>${params.raisedFloor?.reason || ""} (${params.raisedFloor?.expectedBenefit || ""})</td></tr>
      <tr><td><strong>Material</strong></td><td>${params.material?.value || "Composite"}</td><td>${params.material?.trigger || "Climate"}</td><td>${params.material?.reason || ""} (${params.material?.expectedBenefit || ""})</td></tr>
    </tbody>
  </table>

  <h2>5. Climate Adaptation Score Breakdown</h2>
  <p><strong>Overall Adaptation Score:</strong> <span class="score-badge">${d.totalScore} / 100</span></p>
  <table>
    <thead><tr><th>Category</th><th>Weight</th><th>Score Achieved</th><th>Max Points</th></tr></thead>
    <tbody>
      ${Object.values(cat).map(c => `<tr><td>${c.name}</td><td>${c.weight}</td><td><strong>${c.score}</strong></td><td>${c.max}</td></tr>`).join("")}
    </tbody>
  </table>

  <div class="limitations">
    <strong>Limitations & Disclaimer:</strong>
    <ul>
      <li>Demo climate data may be simulated or sourced from regional centroids.</li>
      <li>Results are preliminary decision-support indicators and NOT site-specific structural or mechanical engineering calculations.</li>
      <li>Thermal comfort scoring is a prototype heuristic model.</li>
      <li>3D parametric visualization is conceptual and does not replace construction drawings.</li>
      <li>Recommendations require professional architectural and structural engineering validation before construction.</li>
    </ul>
  </div>

  <div class="footer">
    SHELTR.AI — Conceptual Climate-Adaptive Shelter Design Prototype | Not certified construction documentation.
  </div>
</body>
</html>`;
  }
};

module.exports = reportService;
