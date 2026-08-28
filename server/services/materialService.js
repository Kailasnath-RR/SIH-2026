const materialsList = [
  {
    id: "bamboo-composite",
    name: "Lightweight bamboo composite",
    thermalMass: "Low",
    insulation: "Medium",
    moistureResistance: "High",
    localAvailability: "High",
    durability: "High",
    approximateCostClass: "Low",
    sustainability: "High",
    bestFor: "Hot-humid, high rainfall, flood-prone regions"
  },
  {
    id: "compressed-earth",
    name: "Compressed earth block (CEB)",
    thermalMass: "High",
    insulation: "High",
    moistureResistance: "Medium",
    localAvailability: "High",
    durability: "High",
    approximateCostClass: "Medium",
    sustainability: "High",
    bestFor: "Hot-dry desert, high solar, semi-arid regions"
  },
  {
    id: "insulated-steel",
    name: "Insulated steel sandwich panel",
    thermalMass: "Low",
    insulation: "High",
    moistureResistance: "High",
    localAvailability: "Medium",
    durability: "High",
    approximateCostClass: "High",
    sustainability: "Medium",
    bestFor: "Cold mountain, high wind, rapid emergency response"
  },
  {
    id: "timber-frame",
    name: "Treated timber frame with thatch/shingle",
    thermalMass: "Low",
    insulation: "Medium",
    moistureResistance: "Medium",
    localAvailability: "High",
    durability: "Medium",
    approximateCostClass: "Low",
    sustainability: "High",
    bestFor: "Temperate mountain, coastal rural zones"
  }
];

const materialService = {
  getAllMaterials() {
    return materialsList;
  },

  evaluateSuitability(materialId, env, siteContext = {}) {
    const mat = materialsList.find(m => m.id === materialId || m.name === materialId) || materialsList[0];
    let score = 75;
    const reasons = [];

    const hot = env.temperature >= 32;
    const cold = env.temperature <= 18;
    const humid = env.relativeHumidity >= 70;
    const dry = env.relativeHumidity < 35;
    const highRain = ["High", "Extreme"].includes(env.rainfall) || siteContext.waterRisk === "High";
    const highWind = env.windSpeed >= 4.5 || siteContext.windExposure === "High";

    if (mat.id === "bamboo-composite") {
      if (humid && highRain) { score += 18; reasons.push("High moisture resistance and low thermal mass suit humid monsoon climates."); }
      if (cold) { score -= 15; reasons.push("Low thermal mass limits heat retention in cold climates."); }
    } else if (mat.id === "compressed-earth") {
      if (dry && hot) { score += 20; reasons.push("High thermal mass dampens day-to-night temperature swings in hot-dry zones."); }
      if (highRain) { score -= 12; reasons.push("Requires protective overhangs to prevent moisture degradation during heavy rains."); }
    } else if (mat.id === "insulated-steel") {
      if (cold || highWind) { score += 22; reasons.push("High thermal insulation and structural rigidity suit cold high-altitude or high-wind sites."); }
      if (hot && humid) { score -= 10; reasons.push("Higher cost and low breathability increase mechanical cooling dependence if unventilated."); }
    } else if (mat.id === "timber-frame") {
      if (siteContext.terrain === "Sloped" || siteContext.terrain === "Mountain") { score += 12; reasons.push("Lightweight structural payload simplifies transport on mountain slopes."); }
    }

    score = Math.max(30, Math.min(98, Math.round(score)));

    return {
      material: mat,
      suitabilityScore: score,
      reasons,
      confidence: "Rule-based calculation"
    };
  }
};

module.exports = materialService;
