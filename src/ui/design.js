import { appState } from "../core/state.js";

const $ = (id) => document.getElementById(id);

export function renderDesign() {
  const d = appState.design;
  if (!d) return;

  const briefEl = $("briefContent");
  if (briefEl) {
    const p = d.params;
    const items = [
      ["ROOF TYPE", p.roofType],
      ["VENTILATION", p.ventilation],
      ["OPENINGS", p.openings],
      ["SHADING", p.shading],
      ["OVERHANG", p.overhang],
      ["RAISED FLOOR", p.raisedFloor],
      ["MATERIAL", p.material],
      ["ORIENTATION", p.orientation],
      ["STRUCTURAL CONSIDERATIONS", p.structuralConsiderations]
    ];

    briefEl.innerHTML = items.map(([title, item]) => {
      const val = typeof item.value === "boolean" ? (item.value ? "Enabled (Raised Stilts)" : "Disabled (Ground Contact)") : (item.value || item);
      const trigger = item.trigger ? `<div class="rule-trigger">⚡ <strong>Climate Trigger:</strong> ${item.trigger}</div>` : "";
      const reason = item.reason ? `<div class="rule-reason">💡 <strong>Reason:</strong> ${item.reason}</div>` : "";
      const benefit = item.expectedBenefit ? `<div class="rule-benefit">🎯 <strong>Expected Benefit:</strong> ${item.expectedBenefit}</div>` : "";
      const conf = item.confidence ? `<span class="badge badge-info">Confidence: ${item.confidence}</span>` : "";

      return `
        <div class="recommendation-card glass">
          <div class="rec-header">
            <strong>${title}</strong>
            <span class="rec-value">${val}</span>
          </div>
          ${trigger}
          ${reason}
          ${benefit}
          <div class="rec-footer">${conf}</div>
        </div>
      `;
    }).join("");
  }

  // Render Dynamic Weighted Score Breakdown
  renderScoreBreakdown(d.breakdown);
}

export function renderScoreBreakdown(breakdown) {
  const container = $("scoreBreakdown");
  if (!container || !breakdown || !breakdown.categories) return;

  const cats = Object.values(breakdown.categories);
  const total = breakdown.totalScore;

  container.innerHTML = `
    <div class="adaptation-score-card glass">
      <div class="score-header">
        <span>Climate Adaptation Score</span>
        <strong class="total-score-num">${total} / 100</strong>
      </div>
      <p class="score-subtext">Transparent weighted score calculated dynamically from climate risk alignment and active design parameters.</p>
      <div class="categories-list">
        ${cats.map(c => `
          <div class="cat-row">
            <div class="cat-label-row">
              <span><strong>${c.weight} ${c.name}</strong></span>
              <span><strong>${c.score} / ${c.max} pts</strong></span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width: ${(c.score / c.max) * 100}%; background: ${c.score / c.max > 0.75 ? 'var(--cyan)' : c.score / c.max > 0.5 ? 'var(--amber)' : 'var(--rose)'};"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
