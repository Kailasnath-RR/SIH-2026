const { stateProfiles, demoCities } = require("../data/stateProfiles");
const { indiaGeoJSON } = require("../../src/data/india-geojson");

function pointInRing(pt, ring) {
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function findContainingStateGeoJSON(lat, lng) {
  const pt = [lng, lat];
  for (const feature of indiaGeoJSON.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (geom.type === "Polygon") {
      if (pointInRing(pt, geom.coordinates[0])) {
        return feature.properties.name;
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        if (pointInRing(pt, poly[0])) {
          return feature.properties.name;
        }
      }
    }
  }
  // Fallback to nearest state centroid if slightly off coastal buffer
  const nearest = stateProfiles.reduce((best, s) => {
    const dist = Math.hypot(s.lat - lat, s.lng - lng);
    return dist < best.dist ? { state: s, dist } : best;
  }, { state: stateProfiles[0], dist: Infinity }).state;

  return nearest ? nearest.name : "Karnataka";
}

const locationService = {
  findState(name) {
    if (!name) return null;
    return stateProfiles.find(s => s.name.toLowerCase() === String(name).toLowerCase());
  },

  findNearestState(lat, lng) {
    return stateProfiles.reduce((best, s) => {
      const dist = Math.hypot(s.lat - lat, s.lng - lng);
      return dist < best.dist ? { state: s, dist } : best;
    }, { state: stateProfiles[0], dist: Infinity }).state;
  },

  search(query) {
    if (!query) return [];
    const q = query.trim().toLowerCase();
    const coord = q.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

    if (coord) {
      const lat = Number(coord[1]);
      const lng = Number(coord[3]);
      if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98) {
        const detectedState = findContainingStateGeoJSON(lat, lng);
        const stateObj = this.findState(detectedState) || this.findNearestState(lat, lng);
        return [{
          id: `custom-${lat.toFixed(3)}-${lng.toFixed(3)}`,
          name: `Custom site ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
          state: detectedState,
          district: "Custom site coordinates",
          lat: +lat.toFixed(4),
          lng: +lng.toFixed(4),
          elevation: stateObj ? stateObj.elevation : 50,
          elevationSource: "Open-Meteo Elevation API / Regional estimate",
          source: "Point-in-polygon GeoJSON detection",
          dataType: "Site-specific custom coordinate",
          isCustom: true,
          confidence: "High (Exact coordinates)"
        }];
      }
    }

    const matches = [];

    // Check exact city coordinates
    for (const city of demoCities) {
      if (`${city.name} ${city.state} ${city.district}`.toLowerCase().includes(q)) {
        matches.push({
          id: `city-${city.name.toLowerCase()}`,
          name: city.name,
          state: city.state,
          district: city.district,
          lat: city.lat,
          lng: city.lng,
          elevation: city.elevation,
          elevationSource: "City geospatial dataset",
          source: "Exact city coordinates",
          dataType: "Site-specific city data",
          isCustom: false,
          confidence: "High (Site-specific)"
        });
      }
    }

    // Check states
    for (const state of stateProfiles) {
      if (`${state.name}`.toLowerCase().includes(q)) {
        matches.push({
          id: `state-${state.name.toLowerCase()}`,
          name: state.name,
          state: state.name,
          district: "State centroid",
          lat: state.lat,
          lng: state.lng,
          elevation: state.elevation,
          elevationSource: "State centroid dataset",
          source: "GeoJSON administrative boundary",
          dataType: "Regional climate profile",
          isCustom: false,
          confidence: "Moderate (State centroid)"
        });
      }
    }

    return matches.slice(0, 8);
  }
};

module.exports = locationService;
