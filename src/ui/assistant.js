import { appState } from "../core/state.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function initAssistant() {
  const btn = $("assistantButton");
  const panel = $("assistantPanel");
  const closeBtn = $("closeAssistant");
  const sendBtn = $("chatSend");
  const input = $("chatInput");

  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    panel.hidden = false;
    const chatLog = $("chatLog");
    if (chatLog && !chatLog.children.length) {
      addChatMessage("assistant", getInitialGreeting());
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", () => { panel.hidden = true; });

  if (sendBtn) sendBtn.addEventListener("click", handleSend);
  if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") handleSend(); });
}

function getInitialGreeting() {
  if (!appState.analysis || !appState.design) {
    return "Hello! Select and analyze a location first. I will answer questions using only the structured climate data, engineering metrics, and design parameters.";
  }
  const loc = appState.selectedLocation;
  const a = appState.analysis;
  const d = appState.design;

  return `I am ready for ${loc.name}. The current observed profile shows ${a.env.temperature}°C, ${a.env.relativeHumidity}% humidity, and ${a.comfortScore}/100 thermal comfort score. The recommended shelter design uses a ${d.params.roofType.value.toLowerCase()} roof with ${d.params.ventilation.value.toLowerCase()} ventilation. What would you like to know?`;
}

async function handleSend() {
  const input = $("chatInput");
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;

  addChatMessage("user", q);
  input.value = "";

  const answer = await apiClient.askAssistant(q, {
    location: appState.selectedLocation,
    analysis: appState.analysis,
    design: appState.design,
    siteContext: appState.siteContext
  });

  addChatMessage("assistant", answer);
}

function addChatMessage(role, text) {
  const chatLog = $("chatLog");
  if (!chatLog) return;

  const div = document.createElement("div");
  div.className = `chat-message ${role === "user" ? "user" : "assistant"}`;
  div.innerHTML = text.replace(/\n/g, "<br>");
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}
