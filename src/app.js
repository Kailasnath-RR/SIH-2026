import { appState } from "./core/state.js";
import { demoCities } from "./core/constants.js";
import { apiClient } from "./services/apiClient.js";
import { initMap, renderGeoJSONLayer, selectCoordinates, selectState, findState, filterFacilityMarkers, searchNominatim } from "./ui/map.js";
import { renderAnalysis } from "./ui/analysis.js";
import { renderDesign } from "./ui/design.js";
import { initStudio, updateShelterGeometry } from "./ui/studio.js";
import { populateComparisonOptions } from "./ui/comparison.js";
import { initAssistant } from "./ui/assistant.js";
import { renderSiteContextInputs } from "./ui/siteContext.js";
import { initReportExport } from "./ui/report.js";

const $ = (id) => document.getElementById(id);

export async function analyzeCurrentLocation() {
  if (!appState.selectedLocation) return;

  const result = await apiClient.analyzeDesign(
    appState.selectedLocation,
    appState.siteContext,
    appState.userOverrides
  );

  if (result) {
    appState.analysis = result.analysis;
    appState.design = result.design;
    appState.materials = result.materials;

    // Default overrides from recommendations if un-set
    if (appState.userOverrides.roof === null) appState.userOverrides.roof = result.design.params.roofType.value;
    if (appState.userOverrides.ventilation === null) appState.userOverrides.ventilation = result.design.params.ventilation.value;
    if (appState.userOverrides.shading === null) appState.userOverrides.shading = result.design.params.shading.value;
    if (appState.userOverrides.openings === null) appState.userOverrides.openings = result.design.params.openings.value;
    if (appState.userOverrides.overhang === null) appState.userOverrides.overhang = result.design.params.overhang.value;
    if (appState.userOverrides.raised === null) appState.userOverrides.raised = result.design.params.raisedFloor.value;

    syncControlValues();
    renderAnalysis();
    renderDesign();
    updateShelterGeometry();
  }
}

function syncControlValues() {
  if ($("roofControl")) $("roofControl").value = appState.userOverrides.roof || "Sloped";
  if ($("ventControl")) $("ventControl").value = appState.userOverrides.ventilation || "High";
  if ($("shadeControl")) $("shadeControl").value = appState.userOverrides.shading || "High";
  if ($("openingControl")) $("openingControl").value = appState.userOverrides.openings || "Large";
  if ($("overhangControl")) {
    const val = appState.userOverrides.overhang !== null ? appState.userOverrides.overhang : 1.5;
    $("overhangControl").value = val;
    if ($("overhangValue")) $("overhangValue").textContent = `${val} m`;
  }
  if ($("raisedControl")) $("raisedControl").checked = appState.userOverrides.raised ?? true;
  if ($("materialControl")) $("materialControl").value = appState.userOverrides.material || "Climate Recommended";
}

function bindGlobalEvents() {
  // Search input & button
  const searchBtn = $("searchButton");
  const searchInput = $("locationSearch");
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") handleSearch(); });
  }

  // Metric tabs on map panel
  document.querySelectorAll(".metric-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".metric-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.metric = btn.dataset.metric;
      renderGeoJSONLayer();
    });
  });

  // Layer checkboxes on map panel
  document.querySelectorAll(".layer-groups input[data-layer]:not(:disabled)").forEach(chk => {
    chk.addEventListener("change", e => {
      const layer = e.target.dataset.layer;
      appState.activeLayers[layer] = e.target.checked;
      renderGeoJSONLayer();
    });
  });

  // Facility type filter checkboxes
  document.querySelectorAll("input[data-facility]").forEach(chk => {
    chk.addEventListener("change", e => {
      const facilityType = e.target.dataset.facility;
      appState.facilityFilters[facilityType] = e.target.checked;
      filterFacilityMarkers();
    });
  });

  // Analyze button
  const analyzeBtn = $("analyzeButton");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      analyzeCurrentLocation();
      window.location.hash = "analyze";
    });
  }

  // 3D Studio Real-time Controls ("What-If?" Exploration)
  const roofCtrl = $("roofControl");
  if (roofCtrl) roofCtrl.addEventListener("change", e => { appState.userOverrides.roof = e.target.value; updateShelterGeometry(); });

  const ventCtrl = $("ventControl");
  if (ventCtrl) ventCtrl.addEventListener("change", e => { appState.userOverrides.ventilation = e.target.value; updateShelterGeometry(); });

  const shadeCtrl = $("shadeControl");
  if (shadeCtrl) shadeCtrl.addEventListener("change", e => { appState.userOverrides.shading = e.target.value; updateShelterGeometry(); });

  const openCtrl = $("openingControl");
  if (openCtrl) openCtrl.addEventListener("change", e => { appState.userOverrides.openings = e.target.value; updateShelterGeometry(); });

  const overhangCtrl = $("overhangControl");
  if (overhangCtrl) overhangCtrl.addEventListener("input", e => {
    const val = Number(e.target.value);
    appState.userOverrides.overhang = val;
    if ($("overhangValue")) $("overhangValue").textContent = `${val} m`;
    updateShelterGeometry();
  });

  const raisedCtrl = $("raisedControl");
  if (raisedCtrl) raisedCtrl.addEventListener("change", e => { appState.userOverrides.raised = e.target.checked; updateShelterGeometry(); });

  const matCtrl = $("materialControl");
  if (matCtrl) matCtrl.addEventListener("change", e => { appState.userOverrides.material = e.target.value; updateShelterGeometry(); });

  // 3D Studio Action Buttons
  const resetCamBtn = $("resetCamera");
  if (resetCamBtn) resetCamBtn.addEventListener("click", () => {
    if (appState.three) {
      appState.three.angle = 0.4;
      appState.three.tilt = -0.12;
      appState.three.distance = 9.5;
    }
  });

  const simBtn = $("simulateClimate");
  if (simBtn) simBtn.addEventListener("click", () => {
    appState.simulating = !appState.simulating;
    simBtn.classList.toggle("active", appState.simulating);
    updateShelterGeometry();
  });

  const beforeAfterBtn = $("beforeAfter");
  if (beforeAfterBtn) beforeAfterBtn.addEventListener("click", () => {
    appState.beforeAfter = !appState.beforeAfter;
    beforeAfterBtn.classList.toggle("active", appState.beforeAfter);
    updateShelterGeometry();
  });
}

async function handleSearch() {
  const input = $("locationSearch");
  const resultsContainer = $("searchResults");
  if (!input || !resultsContainer) return;

  const q = input.value.trim();
  if (!q) {
    resultsContainer.innerHTML = "";
    return;
  }

  const results = await apiClient.geocodeSearch(q);
  resultsContainer.innerHTML = results.map((r, i) => `
    <button class="result-item" data-index="${i}" type="button">
      <strong>${r.name}</strong><br>
      <small>${r.admin1 || r.country || ""}</small>
      <span class="prov-badge-sm">Geocoded</span>
    </button>
  `).join("");

  document.querySelectorAll(".result-item").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const loc = results[i];
      // Zoom and fetch intelligence
      selectCoordinates(loc.latitude, loc.longitude, 10);
      resultsContainer.innerHTML = "";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  renderSiteContextInputs();
  bindGlobalEvents();
  populateComparisonOptions();
  initAssistant();
  initReportExport();

  // Initial Location: Visakhapatnam
  selectCoordinates(17.6868, 83.2185, 12);

  analyzeCurrentLocation();

  setTimeout(initStudio, 250);
});
