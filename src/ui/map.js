import { appState } from "../core/state.js";
import { stateProfiles as defaultStateProfiles, demoCities } from "../core/constants.js";
import { indiaGeoJSON } from "../data/india-geojson.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

let leafletMap = null;
let geojsonLayer = null;
let cityMarkersLayer = null;
let customSiteMarker = null;
let dynamicStateProfiles = [...defaultStateProfiles];

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

export async function initMap() {
  const container = $("leafletMap");
  if (!container || leafletMap) return;

  // Fetch /api/config for MapTiler settings
  let mapProvider = "maptiler";
  let mapApiKey = "";

  try {
    const cfgRes = await fetch("/api/config");
    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      mapProvider = cfg.mapProvider || "maptiler";
      mapApiKey = cfg.mapApiKey || "";
    }
  } catch (e) {
    console.warn("Failed to fetch map config, using default tile layer:", e);
  }

  // Fetch Live Open-Meteo 36-State Climate Batch
  try {
    const statesRes = await fetch("/api/climate/states");
    if (statesRes.ok) {
      const statesData = await statesRes.json();
      if (Array.isArray(statesData.states) && statesData.states.length > 0) {
        dynamicStateProfiles = statesData.states;
        appState.stateProfiles = dynamicStateProfiles;
        console.log("Map initialized with live Open-Meteo 36-state weather batch!");
      }
    }
  } catch (e) {
    console.warn("Failed to fetch live 36-state weather batch, using baseline profiles:", e);
  }

  // Initialize Leaflet Map centered on India
  leafletMap = L.map("leafletMap", {
    center: [22.5937, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: false
  });

  // Base Tile Layer Selection
  let tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  if (mapProvider === "maptiler" && mapApiKey) {
    tileUrl = `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${mapApiKey}`;
  }

  L.tileLayer(tileUrl, {
    maxZoom: 18,
    subdomains: "abcd"
  }).addTo(leafletMap);

  cityMarkersLayer = L.layerGroup().addTo(leafletMap);

  renderGeoJSONLayer();
  renderChoroplethLegend();

  // Map Controls
  const zoomInBtn = $("zoomInMap");
  const zoomOutBtn = $("zoomOutMap");
  const resetBtn = $("resetMap");

  if (zoomInBtn) zoomInBtn.addEventListener("click", () => leafletMap.zoomIn());
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => leafletMap.zoomOut());
  if (resetBtn) resetBtn.addEventListener("click", () => {
    appState.selectedState = null;
    leafletMap.setView([22.5937, 78.9629], 5);
    if ($("mapBreadcrumb")) $("mapBreadcrumb").textContent = "India";
    if ($("mapSubline")) $("mapSubline").textContent = "Hover state polygons for climate metrics. Click to select & zoom.";
  });

  window.addEventListener("resize", () => {
    if (leafletMap) leafletMap.invalidateSize();
  });
}

export function renderGeoJSONLayer() {
  if (!leafletMap) return;

  if (geojsonLayer) {
    leafletMap.removeLayer(geojsonLayer);
  }

  geojsonLayer = L.geoJSON(indiaGeoJSON, {
    style: feature => {
      const stateName = feature.properties.name;
      const stateObj = findState(stateName) || findNearestState(22, 78);
      return {
        fillColor: getChoroplethColor(stateObj, appState.metric),
        weight: 1.5,
        opacity: 0.85,
        color: "rgba(141, 232, 218, 0.45)",
        fillOpacity: 0.65
      };
    },
    onEachFeature: (feature, layer) => {
      const stateName = feature.properties.name;
      const stateObj = findState(stateName) || findNearestState(22, 78);
      const isLive = stateObj.isLive;

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 3,
            color: "#55e5d3",
            fillOpacity: 0.85
          });
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
        mouseout: (e) => {
          geojsonLayer.resetStyle(e.target);
        },
        click: (e) => {
          selectState(stateObj, layer);
        }
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
  let title = "Temperature (°C)";
  let lowLabel = "10°C";
  let highLabel = "40°C";
  let gradient = "linear-gradient(90deg, #55e5d3, #ffd166, #ff6b8f)";

  if (m === "humidity") {
    title = "Relative Humidity (%)";
    lowLabel = "20%"; highLabel = "90%";
    gradient = "linear-gradient(90deg, #ffd166, #77a7ff, #55e5d3)";
  } else if (m === "rainfall") {
    title = "Rainfall Exposure";
    lowLabel = "Low"; highLabel = "Extreme";
    gradient = "linear-gradient(90deg, #ffd166, #55e5d3, #77a7ff)";
  } else if (m === "solar") {
    title = "Solar Exposure";
    lowLabel = "Medium"; highLabel = "Extreme";
    gradient = "linear-gradient(90deg, #55e5d3, #ffd166, #ff6b8f)";
  } else if (m === "stress") {
    title = "Thermal Stress Index";
    lowLabel = "Low Stress"; highLabel = "Severe Stress";
    gradient = "linear-gradient(90deg, #7de39b, #ffd166, #ff6b8f)";
  }

  legendEl.innerHTML = `
    <div class="legend-title">${title}</div>
    <div class="legend-bar" style="background: ${gradient};"></div>
    <div class="legend-labels"><span>${lowLabel}</span><span>${highLabel}</span></div>
  `;
}

export function selectState(state, layer = null) {
  appState.selectedState = state;

  if ($("mapBreadcrumb")) $("mapBreadcrumb").textContent = `India -> ${state.name}`;
  if ($("mapSubline")) $("mapSubline").textContent = `Zoomed to ${state.name}. Major city markers enabled.`;

  if (layer && layer.getBounds) {
    leafletMap.fitBounds(layer.getBounds(), { padding: [30, 30] });
  } else {
    leafletMap.setView([state.lat, state.lng], 7);
  }

  if (appState.activeLayers.cities) {
    renderCityMarkers(state);
  }

  const defaultCity = demoCities.find(c => c.state === state.name) || {
    name: state.cities ? state.cities[0] : state.name,
    state: state.name,
    district: "State centroid node",
    lat: state.lat,
    lng: state.lng,
    elevation: state.elevation,
    dataType: "Regional climate profile",
    isCustom: false,
    confidence: "Moderate (State centroid)"
  };

  selectLocation(defaultCity);
}

function renderCityMarkers(state) {
  if (!cityMarkersLayer) return;
  cityMarkersLayer.clearLayers();

  const citiesInState = demoCities.filter(c => c.state === state.name);

  citiesInState.forEach(city => {
    const marker = L.circleMarker([city.lat, city.lng], {
      radius: 7,
      fillColor: "#ffd166",
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });

    marker.bindPopup(`
      <div style="font-size:0.82rem;">
        <strong style="color:#55e5d3; font-size:0.95rem;">${city.name}</strong><br>
        District: ${city.district}, ${city.state}<br>
        Coords: ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}<br>
        Elevation: ${city.elevation} m
      </div>
    `);

    marker.on("click", () => {
      selectLocation({
        name: city.name,
        state: city.state,
        district: city.district,
        lat: city.lat,
        lng: city.lng,
        elevation: city.elevation,
        dataType: "Site-specific city data",
        isCustom: false,
        confidence: "High (Site-specific)"
      });
    });

    cityMarkersLayer.addLayer(marker);
  });
}

export async function selectLocation(location) {
  appState.selectedLocation = location;
  const isCustom = location.isCustom;

  // Query site elevation if custom
  if (isCustom && location.lat && location.lng) {
    try {
      const elevRes = await fetch(`/api/terrain/elevation?lat=${location.lat}&lng=${location.lng}`);
      if (elevRes.ok) {
        const elevData = await elevRes.json();
        if (elevData.elevation !== undefined) {
          location.elevation = elevData.elevation;
          location.elevationSource = elevData.source || "Open-Meteo Elevation API";
        }
      }
    } catch (e) {
      console.warn("Failed to fetch elevation:", e);
    }
  }

  if ($("selectedName")) $("selectedName").textContent = location.name;
  if ($("selectedState")) $("selectedState").textContent = location.state || "-";
  if ($("selectedDistrict")) $("selectedDistrict").textContent = location.district || "-";
  if ($("selectedLat")) $("selectedLat").textContent = location.lat.toFixed(4);
  if ($("selectedLng")) $("selectedLng").textContent = location.lng.toFixed(4);
  if ($("selectedElev")) $("selectedElev").textContent = isCustom ? `${Math.round(location.elevation)} m (${location.elevationSource || "Open-Meteo API"})` : `${Math.round(location.elevation)} m`;

  const stateProfile = findState(location.state) || findNearestState(location.lat, location.lng);
  if ($("selectedClimate")) $("selectedClimate").textContent = stateProfile ? stateProfile.climate : "Regional climate profile";

  // Data Provenance & Precision Badges
  const provEl = $("selectedProvenance");
  if (provEl) {
    provEl.innerHTML = isCustom
      ? `<span class="badge badge-warning">Site-specific Custom Coordinates</span> <span class="badge badge-info">State: ${location.state} (Point-in-Polygon)</span>`
      : `<span class="badge badge-success">${location.dataType || "Site-specific city data"}</span> <span class="badge badge-info">Confidence: ${location.confidence || "High"}</span>`;
  }

  // Update distinct map marker for site
  if (leafletMap) {
    if (customSiteMarker) leafletMap.removeLayer(customSiteMarker);

    const siteIcon = L.divIcon({
      className: "custom-site-pin",
      html: `<div style="background:#ff6b8f; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 16px #ff6b8f;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    customSiteMarker = L.marker([location.lat, location.lng], { icon: siteIcon }).addTo(leafletMap);
    customSiteMarker.bindPopup(`
      <div style="font-size:0.82rem;">
        <strong style="color:#ff6b8f;">● SITE: ${location.name}</strong><br>
        State: ${location.state}<br>
        Coords: ${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E<br>
        Elevation: ${location.elevation} m
      </div>
    `).openPopup();

    leafletMap.setView([location.lat, location.lng], isCustom ? 8 : 7);
  }

  if ($("navLocation")) $("navLocation").textContent = location.name;
  if ($("analyzeButton")) $("analyzeButton").disabled = false;
}
