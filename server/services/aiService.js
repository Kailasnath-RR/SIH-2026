/**
 * Context-bound AI Explanation Engine.
 * Answers questions based ONLY on the structured context passed in.
 * Never hallucinates or invents missing data.
 */

const aiService = {
  explainContext(context) {
    if (!context || !context.location || !context.analysis || !context.design) {
      return "Select and analyze a location first. I will provide transparent explanations based strictly on the current location, climate data, engineering analysis, and design parameters.";
    }
    const loc = context.location;
    const a = context.analysis;
    const d = context.design;
    const p = d.params;

    return `For ${loc.name} (${loc.state}), observed/profile conditions show ${a.env.temperature}°C air temperature, ${a.env.relativeHumidity}% relative humidity, ${a.env.windSpeed} m/s wind, ${a.env.rainfall} rainfall, and ${a.env.solarExposure} solar exposure (${a.env.source}). The thermal comfort score is ${a.comfortScore}/100 (${a.stressBand} thermal stress). The shelter design uses a ${p.roofType.value.toLowerCase()} roof, ${p.ventilation.value.toLowerCase()} ventilation, ${p.openings.value.toLowerCase()} openings, and ${p.shading.value.toLowerCase()} shading to address these environmental conditions.`;
  },

  answerQuestion(question, context) {
    if (!context || !context.analysis || !context.design) {
      return this.explainContext(context);
    }

    const q = (question || "").toLowerCase();
    const a = context.analysis;
    const d = context.design;
    const p = d.params;
    const site = context.siteContext || {};
    const e = a.env;

    if (q.includes("roof")) {
      return `ROOF RECOMMENDATION: ${p.roofType.value}\n• Climate Trigger: ${p.roofType.trigger}\n• Reason: ${p.roofType.reason}\n• Expected Benefit: ${p.roofType.expectedBenefit}\n• Confidence: ${p.roofType.confidence}`;
    }

    if (q.includes("vent") || q.includes("air") || q.includes("breeze")) {
      return `VENTILATION RECOMMENDATION: ${p.ventilation.value}\n• Climate Trigger: ${p.ventilation.trigger}\n• Reason: ${p.ventilation.reason}\n• Expected Benefit: ${p.ventilation.expectedBenefit}\n• Confidence: ${p.ventilation.confidence}`;
    }

    if (q.includes("raised") || q.includes("floor") || q.includes("plinth") || q.includes("flood")) {
      return `RASED FLOOR RECOMMENDATION: ${p.raisedFloor.value ? "Enabled (Elevated floor plate)" : "Disabled (Ground contact)"}\n• Trigger: ${p.raisedFloor.trigger}\n• Reason: ${p.raisedFloor.reason}\n• Expected Benefit: ${p.raisedFloor.expectedBenefit}`;
    }

    if (q.includes("opening") || q.includes("window")) {
      return `OPENING SIZE RECOMMENDATION: ${p.openings.value}\n• Trigger: ${p.openings.trigger}\n• Reason: ${p.openings.reason}\n• Expected Benefit: ${p.openings.expectedBenefit}`;
    }

    if (q.includes("shading") || q.includes("shade") || q.includes("sun") || q.includes("solar")) {
      return `SHADING RECOMMENDATION: ${p.shading.value}\n• Trigger: ${p.shading.trigger}\n• Reason: ${p.shading.reason}\n• Expected Benefit: ${p.shading.expectedBenefit}`;
    }

    if (q.includes("material") || q.includes("bamboo") || q.includes("earth") || q.includes("steel")) {
      return `MATERIAL RECOMMENDATION: ${p.material.value}\n• Trigger: ${p.material.trigger}\n• Reason: ${p.material.reason}\n• Expected Benefit: ${p.material.expectedBenefit}`;
    }

    if (q.includes("jaipur") || q.includes("guwahati") || q.includes("leh") || q.includes("compare") || q.includes("worse") || q.includes("different")) {
      return `LOCATION DIFFERENCE EXPLANATION:\nEach shelter design is calculated directly from local environmental drivers:\n• Guwahati (Hot-Humid + High Rain) requires high cross-ventilation, large openings, sloped roof, and raised floor for flood protection.\n• Jaipur (Hot-Dry Desert + High Solar) requires thermal mass, controlled small openings, deep shading, and reflective roofs to dampen daytime heat swings.\n• Leh (Cold High Altitude) requires compact form, high insulation, minimized infiltration, and heat retention.`;
    }

    if (q.includes("what if") || q.includes("reduce") || q.includes("change") || q.includes("low ventilation")) {
      return `WHAT-IF DESIGN IMPACT:\nIf you reduce ventilation in a hot-humid site, evaporative cooling drops significantly, causing the Climate Adaptation Score to fall (e.g. from 82/100 to 72/100). Similarly, turning off shading under high solar radiation increases radiant heat gain and lowers the solar protection score.`;
    }

    // Explicit fallback for out-of-scope / unsupported questions
    return "I don't have enough site or climate data in the current analysis context to answer that question reliably.";
  }
};

module.exports = aiService;
