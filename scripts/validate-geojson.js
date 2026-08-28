const { indiaGeoJSON } = require("../src/data/india-geojson.js");

function validateGeoJSON() {
  console.log("=== RUNNING GEOJSON GEOMETRY VALIDATION ===");
  if (!indiaGeoJSON || indiaGeoJSON.type !== "FeatureCollection") {
    throw new Error("FAIL: indiaGeoJSON must be a valid FeatureCollection");
  }

  const features = indiaGeoJSON.features;
  console.log(`Total Features Found: ${features.length} (Expected: 36)`);
  if (features.length < 36) {
    throw new Error(`FAIL: Expected 36 features, found ${features.length}`);
  }

  features.forEach((feat, index) => {
    const name = feat.properties?.name || `Index ${index}`;
    const geom = feat.geometry;

    if (!geom || !["Polygon", "MultiPolygon"].includes(geom.type)) {
      throw new Error(`FAIL [${name}]: Invalid geometry type ${geom?.type}`);
    }

    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

    polys.forEach((poly, pIdx) => {
      poly.forEach((ring, rIdx) => {
        if (!Array.isArray(ring) || ring.length < 4) {
          throw new Error(`FAIL [${name} poly ${pIdx} ring ${rIdx}]: Ring must have at least 4 points`);
        }

        // Validate coordinate bounds: Longitude 68-98, Latitude 6-37
        ring.forEach((pt, ptIdx) => {
          const lng = pt[0];
          const lat = pt[1];

          if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
            throw new Error(`FAIL [${name}]: Invalid non-number coordinate at point ${ptIdx}`);
          }

          if (lng < 68 || lng > 98) {
            throw new Error(`FAIL [${name}]: Out-of-bounds Longitude ${lng} at point ${ptIdx} (Expected 68-98)`);
          }
          if (lat < 6 || lat > 37) {
            throw new Error(`FAIL [${name}]: Out-of-bounds Latitude ${lat} at point ${ptIdx} (Expected 6-37)`);
          }
        });

        // Validate closed linear ring
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          throw new Error(`FAIL [${name} poly ${pIdx} ring ${rIdx}]: Linear ring is not closed`);
        }
      });
    });

    console.log(`✓ [${name}]: ${geom.type} validated cleanly.`);
  });

  console.log("\n🎉 ALL 36 GEOJSON STATE/UT BOUNDARY FEATURES VALIDATED PERFECTLY!");
}

try {
  validateGeoJSON();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
