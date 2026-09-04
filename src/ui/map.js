import { appState } from "../core/state.js";
import { stateProfiles as defaultStateProfiles, demoCities, mockFacilityLocations } from "../core/constants.js";
import { indiaGeoJSON } from "../data/india-geojson.js";
import { apiClient } from "../services/apiClient.js";
import { renderSiteIntelligence, renderSiteIntelligenceLoading, renderSiteIntelligenceError } from "./sitePanel.js";

const $ = (id) => document.getElementById(id);

let leafletMap = null;
let geojsonLayer = null;
let cityMarkersLayer = null;
let customSiteMarker = null;
let facilityClusterGroup = null;
let facilityMarkerMap = {};
let userLocMarker = null;
let dynamicStateProfiles = [...defaultStateProfiles];

// ── Marker icon config per facility type ──
const FACILITY_ICONS = {
  shelter:  { symbol: "🏠", color: "#55e5d3", label: "Shelter" },
  hospital: { symbol: "🏥", color: "#ff6b8f", label: "Hospital" },
  relief:   { symbol: "➕", color: "#7de39b", label: "Relief Center" },
  food:     { symbol: "🍲", color: "#77a7ff", label: "Food Distribution" },
  disaster: { symbol: "⚠️", color: "#ffd166", label: "Disaster Zone" }
};

function createFacilityIcon(type) {
  const cfg = FACILITY_ICONS[type] || FACILITY_ICONS.shelter;
  return L.divIcon({
    className: "facility-marker",
    html: `<div class="fm-pin" style="--fm-color:${cfg.color}"><span class="fm-icon">${cfg.symbol}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44]
  });
}

function buildPopupHTML(loc) {
  const cfg = FACILITY_ICONS[loc.type] || FACILITY_ICONS.shelter;
  const available = loc.capacity && loc.occupied != null ? loc.capacity - loc.occupied : null;
  const statusColor = loc.status === "available" || loc.status === "active" || loc.status === "operational"
    ? "#7de39b" : loc.status === "near-full" || loc.status === "critical" ? "#ff6b8f" : "#ffd166";

  let details = "";
  if (loc.capacity) {
    details += `<div class="fp-row"><span>Capacity</span><strong>${loc.capacity}</strong></div>`;
    if (loc.occupied != null) details += `<div class="fp-row"><span>Occupied</span><strong>${loc.occupied}</strong></div>`;
    if (available != null) details += `<div class="fp-row"><span>Available</span><strong>${available}</strong></div>`;
  }
  if (loc.severity) details += `<div class="fp-row"><span>Severity</span><strong style="color:${statusColor}">${loc.severity.toUpperCase()}</strong></div>`;

  return `<div class="facility-popup">
    <div class="fp-header" style="border-color:${cfg.color}">
      <span class="fp-type" style="color:${cfg.color}">${cfg.symbol} ${cfg.label}</span>
      <strong class="fp-name">${loc.name}</strong>
    </div>
    ${details}
    <div class="fp-row"><span>Status</span><strong style="color:${statusColor}">${(loc.status || "unknown").toUpperCase()}</strong></div>
    <div class="fp-row fp-coords"><span>Location</span><strong>${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</strong></div>
    ${loc.state ? `<div class="fp-row"><span>State</span><strong>${loc.state}</strong></div>` : ""}
  </div>`;
}

// ── Public API: Reusable marker functions ──

export function addLocationMarker(location) {
  // Facility map marker rendering disabled per user request.
  // The facility data remains intact in appState.facilityMarkers for intelligence processing.
  return null;
}

export function removeLocationMarker(id) {
  const marker = facilityMarkerMap[id];
  if (marker && facilityClusterGroup) {
    facilityClusterGroup.removeLayer(marker);
    delete facilityMarkerMap[id];
  }
}

export function updateLocationMarker(location) {
  removeLocationMarker(location.id);
  return addLocationMarker(location);
}

export function clearLocationMarkers() {
  if (facilityClusterGroup) facilityClusterGroup.clearLayers();
  facilityMarkerMap = {};
}

export function fitMapToLocations() {
  if (!facilityClusterGroup || !leafletMap) return;
  const bounds = facilityClusterGroup.getBounds();
  if (bounds.isValid()) leafletMap.fitBounds(bounds, { padding: [40, 40] });
}

export async function loadFacilityLocations() {
  let locations = mockFacilityLocations;

  // Backend-ready: swap mock with API call when available
  try {
    const res = await fetch("/api/locations");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        locations = data.locations;
      }
    }
  } catch (_) { /* use mock data */ }

  clearLocationMarkers();
  locations.forEach(loc => addLocationMarker(loc));
  appState.facilityMarkers = locations;
}

export function filterFacilityMarkers() {
  clearLocationMarkers();
  (appState.facilityMarkers || []).forEach(loc => addLocationMarker(loc));
}

// ── State/search helpers ──

export function findState(name) {
  if (!name) return null;
  return dynamicStateProfiles.find(s => s.name.toLowerCase() === String(name).toLowerCase());
}

export function findNearestState(lat, lng) {
  return dynamicStateProfiles.reduce((best, s) => {
    const dist = Math.hypot(s.lat - lat, s.lng - lng);
    return dist < best.dist ? { state: s, dist } : best;
  }, { state: dynamicStateProfiles[0], dist: Infinity }).state;
}

// ── Nominatim search (free, OpenStreetMap-based) ──

export async function searchNominatim(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " India")}&format=json&limit=6&addressdetails=1&countrycodes=in`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return [];
    return await res.json();
  } catch (_) { return []; }
}

// ── My Location ──

export function initMyLocation() {
  const btn = $("myLocationBtn");
  if (!btn || !leafletMap) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    btn.textContent = "Locating…";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userLocMarker) {
          leafletMap.removeLayer(userLocMarker);
          userLocMarker = null;
        }

        // We use the unified pipeline to set the single selected location marker
        selectCoordinates(latitude, longitude, 13);

        btn.textContent = "📍 My Location";
        btn.disabled = false;
      },
      (err) => {
        alert("Could not get your location: " + err.message);
        btn.textContent = "📍 My Location";
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ── Map initialization ──

export async function initMap() {
  const container = $("leafletMap");
  if (!container || leafletMap) return;

  // Fetch live 36-state climate batch
  try {
    const statesRes = await fetch("/api/climate/states");
    if (statesRes.ok) {
      const statesData = await statesRes.json();
      if (Array.isArray(statesData.states) && statesData.states.length > 0) {
        dynamicStateProfiles = statesData.states;
        appState.stateProfiles = dynamicStateProfiles;
      }
    }
  } catch (_) { }

  // Initialize Leaflet map centered on India
  leafletMap = L.map("leafletMap", {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: false,
    minZoom: 4,
    maxZoom: 18
  });

  // OpenStreetMap free base tiles — dark appearance via CSS filter
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(leafletMap);

  // Apply light theme filter to soften OpenStreetMap tiles
  // leafletMap.getPane("tilePane").style.filter = "saturate(0.6) brightness(1.05) contrast(0.95)";

  cityMarkersLayer = L.layerGroup().addTo(leafletMap);

  // Marker cluster group for facility markers
  if (typeof L.markerClusterGroup === "function") {
    facilityClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = "small";
        if (count > 10) size = "medium";
        if (count > 25) size = "large";
        return L.divIcon({
          html: `<div class="fm-cluster fm-cluster-${size}"><span>${count}</span></div>`,
          className: "fm-cluster-icon",
          iconSize: [40, 40]
        });
      }
    });
    leafletMap.addLayer(facilityClusterGroup);
  } else {
    facilityClusterGroup = L.layerGroup().addTo(leafletMap);
  }

  renderGeoJSONLayer();
  renderChoroplethLegend();
  loadFacilityLocations();

  // Map controls
  const zoomInBtn = $("zoomInMap");
  const zoomOutBtn = $("zoomOutMap");
  const resetBtn = $("resetMap");

  if (zoomInBtn) zoomInBtn.addEventListener("click", () => leafletMap.zoomIn());
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => leafletMap.zoomOut());
  if (resetBtn) resetBtn.addEventListener("click", () => {
    appState.selectedState = null;
    leafletMap.setView([20.5937, 78.9629], 5);
    if ($("mapBreadcrumb")) $("mapBreadcrumb").textContent = "India";
    if ($("mapSubline")) $("mapSubline").textContent = "Hover state polygons for climate metrics. Click to select & zoom.";
    if (cityMarkersLayer) cityMarkersLayer.clearLayers();
  });

  // My Location
  initMyLocation();

  // Map Click Handler for unified site intelligence
  leafletMap.on("click", (e) => {
    selectCoordinates(e.latlng.lat, e.latlng.lng);
  });

  // Responsive resize
  window.addEventListener("resize", () => { if (leafletMap) leafletMap.invalidateSize(); });
}

// ── GeoJSON state boundary layer with choropleth ──

export function renderGeoJSONLayer() {
  if (!leafletMap) return;
  if (geojsonLayer) leafletMap.removeLayer(geojsonLayer);

  geojsonLayer = L.geoJSON(indiaGeoJSON, {
    style: feature => {
      const stateName = feature.properties.name;
      const stateObj = findState(stateName) || findNearestState(22, 78);
      return {
        fillColor: getChoroplethColor(stateObj, appState.metric),
        weight: 1.5,
        opacity: 0.85,
        color: "rgba(141, 232, 218, 0.45)",
        fillOpacity: 0.55
      };
    },
    onEachFeature: (feature, layer) => {
      const stateName = feature.properties.name;
      const stateObj = findState(stateName) || findNearestState(22, 78);
      const isLive = stateObj.isLive;

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ weight: 3, color: "#55e5d3", fillOpacity: 0.8 });
          l.bringToFront();
          l.bindTooltip(`
            <div style="font-size:0.8rem; line-height:1.5;">
              <strong style="color:#55e5d3; font-size:0.9rem;">${stateObj.name}</strong> 
              <span style="font-size:0.68rem; color:${isLive ? "#7de39b" : "#ffd166"};">(${isLive ? "Open-Meteo Live" : "Demo Profile"})</span><br>
              <em>${stateObj.climate}</em><br>
              Temp: <strong>${stateObj.temperature}°C</strong> | Humidity: <strong>${stateObj.humidity}%</strong><br>
              Rainfall: <strong>${stateObj.rainfall}</strong> | Solar: <strong>${stateObj.solar}</strong>
            </div>
          `, { sticky: true }).openTooltip();
        },
        mouseout: (e) => { geojsonLayer.resetStyle(e.target); },
        click: () => { selectState(stateObj, layer); }
      });
    }
  }).addTo(leafletMap);

  renderChoroplethLegend();
}

function getChoroplethColor(state, metric) {
  let val = state.temperature;
  if (metric === "humidity") {
    val = state.humidity;
    return val > 75 ? "#55e5d3" : val > 50 ? "#77a7ff" : "#ffd166";
  } else if (metric === "rainfall") {
    const rMap = { Low: 25, Medium: 55, High: 80, Extreme: 98 };
    val = rMap[state.rainfall] || 50;
    return val > 75 ? "#77a7ff" : val > 45 ? "#55e5d3" : "#ffd166";
  } else if (metric === "solar") {
    const sMap = { Medium: 45, High: 75, Extreme: 98 };
    val = sMap[state.solar] || 50;
    return val > 75 ? "#ff6b8f" : val > 50 ? "#ffd166" : "#55e5d3";
  } else if (metric === "stress") {
    val = state.temperature * 1.5 + state.humidity * 0.4;
    return val > 80 ? "#ff6b8f" : val > 60 ? "#ffd166" : "#7de39b";
  }
  return val > 36 ? "#ff6b8f" : val > 28 ? "#ffd166" : "#55e5d3";
}

export function renderChoroplethLegend() {
  const legendEl = $("mapLegend");
  if (!legendEl) return;

  const m = appState.metric;
  let title = "Temperature (°C)", lowLabel = "10°C", highLabel = "40°C";
  let gradient = "linear-gradient(90deg, #55e5d3, #ffd166, #ff6b8f)";

  if (m === "humidity") {
    title = "Relative Humidity (%)"; lowLabel = "20%"; highLabel = "90%";
    gradient = "linear-gradient(90deg, #ffd166, #77a7ff, #55e5d3)";
  } else if (m === "rainfall") {
    title = "Rainfall Exposure"; lowLabel = "Low"; highLabel = "Extreme";
    gradient = "linear-gradient(90deg, #ffd166, #55e5d3, #77a7ff)";
  } else if (m === "solar") {
    title = "Solar Exposure"; lowLabel = "Medium"; highLabel = "Extreme";
    gradient = "linear-gradient(90deg, #55e5d3, #ffd166, #ff6b8f)";
  } else if (m === "stress") {
    title = "Thermal Stress Index"; lowLabel = "Low Stress"; highLabel = "Severe Stress";
    gradient = "linear-gradient(90deg, #7de39b, #ffd166, #ff6b8f)";
  }

  legendEl.innerHTML = `
    <div class="legend-title">${title}</div>
    <div class="legend-bar" style="background: ${gradient};"></div>
    <div class="legend-labels"><span>${lowLabel}</span><span>${highLabel}</span></div>
  `;
}

// ── State selection & zoom ──

export function selectState(state, layer = null) {
  appState.selectedState = state;

  if ($("mapBreadcrumb")) $("mapBreadcrumb").textContent = `India → ${state.name}`;
  if ($("mapSubline")) $("mapSubline").textContent = `Zoomed to ${state.name}. City & facility markers visible.`;

  if (layer && layer.getBounds) {
    leafletMap.fitBounds(layer.getBounds(), { padding: [30, 30] });
  } else {
    leafletMap.setView([state.lat, state.lng], 7);
  }

  if (appState.activeLayers.cities) renderCityMarkers(state);

  const defaultCity = demoCities.find(c => c.state === state.name);
  if (defaultCity) {
    selectCoordinates(defaultCity.lat, defaultCity.lng);
  } else {
    selectCoordinates(state.lat, state.lng);
  }
}

function renderCityMarkers(state) {
  if (!cityMarkersLayer) return;
  cityMarkersLayer.clearLayers();

  const citiesInState = demoCities.filter(c => c.state === state.name);
  // City marker rendering disabled per user request
  /*
  citiesInState.forEach(city => {
    const marker = L.circleMarker([city.lat, city.lng], {
      radius: 7, fillColor: "#ffd166", color: "#ffffff",
      weight: 2, opacity: 1, fillOpacity: 0.9
    });
    marker.bindPopup(`<div style="font-size:0.82rem;">
      <strong style="color:#55e5d3; font-size:0.95rem;">${city.name}</strong><br>
      District: ${city.district}, ${city.state}<br>
      Coords: ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}<br>
      Elevation: ${city.elevation} m
    </div>`);
    marker.on("click", () => {
      selectCoordinates(city.lat, city.lng);
    });
    cityMarkersLayer.addLayer(marker);
  });
  */
}

// ── Location selection (Unified Pipeline) ──

export async function selectCoordinates(lat, lng, zoomLevel = null) {
  // Update map marker and view immediately
  if (leafletMap) {
    if (customSiteMarker) leafletMap.removeLayer(customSiteMarker);
    const siteIcon = L.divIcon({
      className: "custom-site-pin",
      html: `<div style="background:#ff6b8f; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 16px #ff6b8f;"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7]
    });
    customSiteMarker = L.marker([lat, lng], { icon: siteIcon }).addTo(leafletMap);
    
    // Zoom if provided or if map is zoomed out too much
    if (zoomLevel) {
      leafletMap.setView([lat, lng], zoomLevel);
    } else if (leafletMap.getZoom() < 8) {
      leafletMap.setView([lat, lng], 8);
    }
  }

  // Show loading state in right panel
  renderSiteIntelligenceLoading(lat, lng);

  // Fetch intelligence data
  try {
    const data = await apiClient.getSiteIntelligence(lat, lng);
    if (!data) throw new Error("API returned no data");
    
    // Update marker popup with resolved name
    if (customSiteMarker) {
      customSiteMarker.bindPopup(`<div style="font-size:0.82rem;">
        <strong style="color:#ff6b8f;">● SITE: ${data.address.name}</strong><br>
        State: ${data.address.state || "-"}<br>
        Coords: ${data.coordinates.latitude}° N, ${data.coordinates.longitude}° E<br>
        Elevation: ${data.environment.elevation != null ? data.environment.elevation + "m" : "Unknown"}
      </div>`).openPopup();
    }

    renderSiteIntelligence(data);
  } catch (err) {
    renderSiteIntelligenceError(lat, lng, err);
  }
}
