import { appState } from "../core/state.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function initReportExport() {
  const btn = $("exportReport");
  if (!btn) return;

  btn.addEventListener("click", exportHtmlReport);
}

export async function exportHtmlReport() {
  if (!appState.analysis || !appState.design) {
    alert("Please select and analyze a location before generating a report.");
    return;
  }

  const context = {
    location: appState.selectedLocation,
    analysis: appState.analysis,
    design: appState.design,
    siteContext: appState.siteContext
  };

  const html = await apiClient.generateReport(context);

  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.write(html);
    reportWindow.document.close();
  } else {
    // Fallback: Blob download
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sheltr-ai-${(appState.selectedLocation?.name || "design").toLowerCase()}-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
