/**
 * Application State Manager
 */

export const appState = {
  metric: "temperature",
  selectedState: null,
  selectedLocation: null,
  siteContext: {
    terrain: "Flat",
    exposure: "Open",
    waterRisk: "Low",
    windExposure: "Low"
  },
  analysis: null,
  design: null,
  materials: [],
  userOverrides: {
    roof: null,
    ventilation: null,
    shading: null,
    openings: null,
    overhang: null,
    raised: null,
    material: "Climate Recommended"
  },
  activeLayers: {
    rivers: true,
    terrain: true,
    cities: true,
    roads: true,
    forest: true
  },
  three: null,
  simulating: false,
  beforeAfter: false,
  comparisonSelection: {
    locationA: "Guwahati",
    locationB: "Jaipur"
  }
};

export function updateState(key, value) {
  appState[key] = value;
}
