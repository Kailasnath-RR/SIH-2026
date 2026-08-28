const materialService = require("./materialService");

const designEngine = {
  /**
   * Generates structured recommendations incorporating climate data and site context.
   */
  recommend(analysis, siteContext = {}) {
    const e = analysis.env;
    const site = {
      terrain: siteContext.terrain || "Flat",
      exposure: siteContext.exposure || "Open",
      waterRisk: siteContext.waterRisk || "Low",
      windExposure: siteContext.windExposure || "Low"
    };

    const hot = e.temperature >= 32;
    const humid = e.relativeHumidity >= 70;
    const dry = e.relativeHumidity < 35;
    const cold = e.temperature <= 18;
    const highRain = ["High", "Extreme"].includes(e.rainfall) || site.waterRisk === "High" || site.terrain === "Flood-prone";
    const highSolar = ["High", "Extreme"].includes(e.solarExposure) || site.exposure === "Open";
    const highWind = e.windSpeed >= 4.5 || site.windExposure === "High" || site.terrain === "Mountain";

    // Structured Recommendations with Trigger, Reason, Expected Benefit, and Confidence
    const roof = {
      value: highRain ? "Sloped" : hot && highSolar ? "Double roof" : cold ? "Compact insulated roof" : "Sloped",
      trigger: highRain ? `Rainfall marked ${e.rainfall} / Water risk ${site.waterRisk}` : hot && highSolar ? `High Solar load (${e.solarExposure})` : "Standard baseline",
      reason: highRain ? "High rainfall increases the need for rapid surface runoff and leak prevention." : hot && highSolar ? "Ventilated upper cavity dissipates solar radiation before penetrating internal envelope." : "Provides balanced runoff and weather protection.",
      expectedBenefit: highRain ? "Rapid water drainage and lower ceiling dampness risk." : "Reduces radiant heat gain through the roof plane by 30-40%.",
      confidence: "Rule-based / High"
    };

    const ventilation = {
      value: hot && humid ? "High" : dry || cold ? "Low" : "Medium",
      trigger: hot && humid ? `High Humidity (${e.relativeHumidity}%) + Temp (${e.temperature}°C)` : dry || cold ? `Low RH / Cold Air (${e.temperature}°C)` : "Moderate climate",
      reason: hot && humid ? "High humidity reduces sweat evaporation effectiveness; continuous air movement is required for physiological cooling." : dry || cold ? "Uncontrolled airflow risks rapid moisture loss or internal heat loss." : "Sufficient air exchange for indoor air quality.",
      expectedBenefit: hot && humid ? "Increases perceived cooling by 2-3°C through skin convection." : "Preserves internal warmth and prevents drafty infiltration.",
      confidence: "Rule-based / High"
    };

    const openings = {
      value: hot && humid ? "Large" : dry || cold ? "Small" : "Medium",
      trigger: hot && humid ? "High humidity cross-ventilation target" : dry || cold ? "Thermal envelope control requirement" : "Standard daylight target",
      reason: hot && humid ? "Large operable windows on opposing walls maximize prevailing breeze intake." : dry || cold ? "Smaller openings minimize unwanted solar heat gain or cold wind infiltration." : "Provides adequate daylight and moderate ventilation.",
      expectedBenefit: hot && humid ? "Unobstructed cross-ventilation flow paths." : "Protects internal thermal mass from external extremes.",
      confidence: "Rule-based / High"
    };

    const shading = {
      value: highSolar ? "High" : "Medium",
      trigger: `Solar Exposure ${e.solarExposure} / Site Exposure ${site.exposure}`,
      reason: highSolar ? "Direct solar irradiance through unshaded glazing sharply spikes operative internal temperature." : "Standard seasonal shading protection.",
      expectedBenefit: highSolar ? "Blocks direct solar radiation on east/west facades during peak heat hours." : "Maintains moderate visual and thermal glare protection.",
      confidence: "Rule-based / High"
    };

    const overhang = {
      value: highRain || highSolar ? 1.5 : 0.8,
      trigger: highRain || highSolar ? "High rainfall or solar exposure" : "Moderate climate overhang baseline",
      reason: highRain ? "Deep eave overhangs protect exterior wall surfaces and window openings from driven rain." : "Shades vertical wall surfaces from high noon sun angles.",
      expectedBenefit: "Keeps walls dry and shades perimeter windows.",
      confidence: "Rule-based / High"
    };

    const raisedFloor = {
      value: highRain || site.waterRisk === "High" || site.terrain === "Flood-prone" || humid,
      trigger: highRain || site.waterRisk === "High" || site.terrain === "Flood-prone" ? "High rainfall / Flood risk / High moisture" : "Low ground moisture risk",
      reason: highRain || site.waterRisk === "High" ? "Lifting the living floor plate off the ground prevents surface water inundation and dampness capillary draw." : "Standard slab on grade ground contact.",
      expectedBenefit: "Eliminates flood risk and enables under-floor cooling airflow.",
      confidence: "Rule-based / High"
    };

    const materialEval = materialService.evaluateSuitability(
      cold ? "insulated-steel" : dry ? "compressed-earth" : "bamboo-composite",
      e,
      site
    );

    const material = {
      value: materialEval.material.name,
      trigger: `Climate classification: ${e.climateClassification} / Temp ${e.temperature}°C`,
      reason: materialEval.reasons.join(" ") || "Selected based on thermal mass and local durability fit.",
      expectedBenefit: `Suitability score ${materialEval.suitabilityScore}/100 with ${materialEval.material.approximateCostClass} cost class.`,
      confidence: "Rule-based / High"
    };

    const orientation = {
      value: highSolar ? "Long axis East-West; shade East & West facades" : "Orient primary openings toward prevailing breeze",
      trigger: highSolar ? "Peak solar radiation along East-West solar track" : "Prevailing wind vector orientation",
      reason: highSolar ? "Minimizes solar exposure on short East/West walls while maximizing North/South daylighting." : "Aligns operable windows with local micro-breeze direction.",
      expectedBenefit: "Reduces peak daily radiant heat accumulation.",
      confidence: "Rule-based / Moderate"
    };

    const structuralConsiderations = {
      value: highWind ? "Reinforced post bracing + hurricane ties + aerodynamic roof slope" : site.waterRisk === "High" ? "Elevated concrete/timber stilts with flood-proof anchoring" : "Standard timber/bamboo framing grid",
      trigger: highWind ? `Elevated wind speed (${e.windSpeed} m/s) / ${site.windExposure} wind exposure` : site.waterRisk === "High" ? "Elevated flood & ground moisture risk" : "Baseline structural load",
      reason: highWind ? "High wind velocities generate uplift forces on lightweight roof planes." : "Prevents structural erosion and ground settlement.",
      expectedBenefit: "Ensures structural stability and wind load safety.",
      confidence: "Rule-based / High"
    };

    const recs = {
      roofType: roof,
      ventilation,
      openings,
      shading,
      overhang,
      raisedFloor,
      material,
      orientation,
      structuralConsiderations,
      rainProtection: highRain ? "Required" : "Advisory",
      solarProtection: highSolar ? "Required" : "Advisory"
    };

    // Calculate dynamic weighted score based on parameters (allows user controls override)
    const breakdown = this.calculateWeightedScore(recs, analysis, site, {});

    return {
      params: recs,
      breakdown,
      totalScore: breakdown.totalScore
    };
  },

  /**
   * Transparent Weighted Score Calculation:
   * 30% Thermal response
   * 20% Ventilation
   * 20% Solar protection
   * 15% Rain/moisture protection
   * 15% Material suitability
   */
  calculateWeightedScore(recs, analysis, siteContext = {}, userOverrides = {}) {
    const e = analysis.env;
    const site = siteContext;

    // Active design parameters (user overrides or defaults)
    const activeRoof = userOverrides.roof || recs.roofType.value;
    const activeVent = userOverrides.ventilation || recs.ventilation.value;
    const activeShade = userOverrides.shading || recs.shading.value;
    const activeOpenings = userOverrides.openings || recs.openings.value;
    const activeOverhang = userOverrides.overhang !== undefined ? Number(userOverrides.overhang) : recs.overhang.value;
    const activeRaised = userOverrides.raised !== undefined ? Boolean(userOverrides.raised) : recs.raisedFloor.value;
    const activeMatName = userOverrides.material && userOverrides.material !== "Climate Recommended" ? userOverrides.material : recs.material.value;

    const hot = e.temperature >= 32;
    const humid = e.relativeHumidity >= 70;
    const dry = e.relativeHumidity < 35;
    const cold = e.temperature <= 18;
    const highRain = ["High", "Extreme"].includes(e.rainfall) || site.waterRisk === "High" || site.terrain === "Flood-prone";
    const highSolar = ["High", "Extreme"].includes(e.solarExposure) || site.exposure === "Open";

    // 1. Thermal response (Max 30 pts)
    let thermalPts = 22;
    if (cold && activeMatName.includes("steel")) thermalPts += 6;
    if (dry && activeMatName.includes("earth")) thermalPts += 7;
    if (activeShade === "High") thermalPts += 4;
    if (activeVent === "High" && humid) thermalPts += 4;
    if (activeVent === "Low" && humid) thermalPts -= 8; // Penalty for poor ventilation in humid heat
    thermalPts = Math.max(5, Math.min(30, thermalPts));

    // 2. Ventilation (Max 20 pts)
    let ventPts = 14;
    if (humid && activeVent === "High") ventPts = 19;
    else if (humid && activeVent === "Medium") ventPts = 14;
    else if (humid && activeVent === "Low") ventPts = 6; // severe penalty
    else if ((dry || cold) && activeVent === "Low") ventPts = 18;
    else if ((dry || cold) && activeVent === "High") ventPts = 8; // penalty for over-ventilation in dry/cold
    ventPts = Math.max(4, Math.min(20, ventPts));

    // 3. Solar protection (Max 20 pts)
    let solarPts = 12;
    if (activeShade === "High") solarPts += 6;
    if (activeShade === "Medium") solarPts += 3;
    if (activeShade === "Low") solarPts -= 5;
    if (activeOverhang >= 1.4) solarPts += 2;
    if (activeRoof === "Double roof") solarPts += 3;
    solarPts = Math.max(3, Math.min(20, solarPts));

    // 4. Rain protection (Max 15 pts)
    let rainPts = 10;
    if (highRain) {
      if (activeRoof === "Sloped") rainPts += 3;
      if (activeRoof === "Flat") rainPts -= 6;
      if (activeRaised) rainPts += 3;
      if (!activeRaised) rainPts -= 5; // Penalty for un-raised floor in flood/high rain
      if (activeOverhang >= 1.2) rainPts += 2;
    } else {
      rainPts = 13;
    }
    rainPts = Math.max(2, Math.min(15, rainPts));

    // 5. Material suitability (Max 15 pts)
    const matEval = materialService.evaluateSuitability(activeMatName, e, site);
    const matPts = Math.max(4, Math.min(15, Math.round((matEval.suitabilityScore / 100) * 15)));

    const totalScore = thermalPts + ventPts + solarPts + rainPts + matPts;

    return {
      categories: {
        thermalResponse: { name: "Thermal response", score: thermalPts, max: 30, weight: "30%" },
        ventilation: { name: "Ventilation", score: ventPts, max: 20, weight: "20%" },
        solarProtection: { name: "Solar protection", score: solarPts, max: 20, weight: "20%" },
        rainProtection: { name: "Rain protection", score: rainPts, max: 15, weight: "15%" },
        materialSuitability: { name: "Material suitability", score: matPts, max: 15, weight: "15%" }
      },
      totalScore,
      userOverrides
    };
  }
};

module.exports = designEngine;
