const climateService = require("./climateService");

const thermalService = {
  /**
   * Steadman Heat Index calculation (°C)
   */
  heatIndex(tempC, rh) {
    const t = tempC * 9 / 5 + 32;
    const hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh
      - 0.00683783 * t * t - 0.05481717 * rh * rh + 0.00122874 * t * t * rh
      + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
    return +((hi - 32) * 5 / 9).toFixed(1);
  },

  async analyze(location) {
    const env = await climateService.getCurrentConditions(location);
    const heatIndexVal = this.heatIndex(env.temperature, env.relativeHumidity);

    // Component Score Contributions (0-100 sub-scores representing relative comfort impact)
    // 1. Air Temperature Score (Optimal ~ 22-26 C)
    let tempScore = 100 - Math.abs(env.temperature - 24) * 4.5;
    if (env.temperature > 38) tempScore -= 15;
    if (env.temperature < 15) tempScore -= 10;
    tempScore = Math.max(10, Math.min(100, Math.round(tempScore)));

    // 2. Relative Humidity Score (Optimal ~ 40-60%)
    let rhScore = 100 - Math.abs(env.relativeHumidity - 50) * 1.2;
    if (env.relativeHumidity > 75) rhScore -= 18; // reduces evaporative cooling
    rhScore = Math.max(10, Math.min(100, Math.round(rhScore)));

    // 3. Solar Exposure Penalty / Score
    const solarPenalty = env.solarExposure === "Extreme" ? 30 : env.solarExposure === "High" ? 20 : env.solarExposure === "Medium" ? 10 : 0;
    const solarScore = Math.max(10, 100 - solarPenalty);

    // 4. Wind Relief Bonus / Score
    const windBonus = Math.min(25, env.windSpeed * 4.5);
    const windScore = Math.min(100, Math.round(50 + windBonus));

    // 5. Rain/Moisture Exposure Score
    const rainPenalty = env.rainfall === "Extreme" ? 35 : env.rainfall === "High" ? 22 : env.rainfall === "Medium" ? 10 : 0;
    const rainScore = Math.max(10, 100 - rainPenalty);

    // Total Comfort Score (Weighted combination of components)
    const comfortScore = Math.max(0, Math.min(100, Math.round(
      tempScore * 0.35 + rhScore * 0.25 + solarScore * 0.18 + windScore * 0.12 + rainScore * 0.10
    )));

    const thermalStress = 100 - comfortScore;
    const stressBand = comfortScore < 35 ? "Severe" : comfortScore < 55 ? "High" : comfortScore < 75 ? "Moderate" : "Low";

    return {
      location,
      env,
      heatIndex: heatIndexVal,
      comfortScore,
      thermalStress,
      stressBand,
      componentScores: {
        airTemperature: { label: "Air Temperature", score: tempScore, val: `${env.temperature}°C`, impact: env.temperature > 30 ? "High Heat Load" : env.temperature < 18 ? "Cold Strain" : "Optimal Range" },
        relativeHumidity: { label: "Relative Humidity", score: rhScore, val: `${env.relativeHumidity}%`, impact: env.relativeHumidity > 70 ? "Impairs Evaporative Cooling" : "Comfortable Moisture" },
        solarExposure: { label: "Solar Exposure", score: solarScore, val: env.solarExposure, impact: env.solarExposure === "Extreme" || env.solarExposure === "High" ? "Elevated Radiant Heat" : "Moderate Solar" },
        windRelief: { label: "Wind Relief", score: windScore, val: `${env.windSpeed} m/s`, impact: env.windSpeed > 3 ? "Beneficial Convective Cooling" : "Stagnant Air" },
        rainMoisture: { label: "Rain/Moisture", score: rainScore, val: env.rainfall, impact: env.rainfall === "Extreme" || env.rainfall === "High" ? "High Drainage Risk" : "Low Rain Exposure" }
      },
      assumptions: {
        activity: "Light metabolic activity (~1.0 met / 100 W/m² seated/resting)",
        clothing: "Light summer attire (~0.5 clo thermal insulation)",
        shelter: "Unconditioned shaded structure, natural ventilation target",
        calculationMethod: "Steadman Heat Index modified by convective wind & radiant solar factors",
        limitations: "Prototype heuristic comfort model for conceptual guidance; NOT a certified ASHRAE-55 / ISO-7730 PMV calculation."
      },
      confidence: env.isLive ? "High (Observed Data)" : "Moderate (Simulated Regional Profile)"
    };
  }
};

module.exports = thermalService;
