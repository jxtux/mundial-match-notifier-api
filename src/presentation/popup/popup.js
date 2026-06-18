import { MESSAGE_TYPES } from "../../shared/message-types.js";

/*
  popup.js
  Capa de presentación/controlador.

  Su trabajo es escuchar la interacción del usuario y comunicarse con
  el service worker usando chrome.runtime.sendMessage.
*/

document.addEventListener("DOMContentLoaded", async () => {
  const matchBox = document.getElementById("matchBox");
  const refreshBtn = document.getElementById("refreshBtn");
  const directTestBtn = document.getElementById("directTestBtn");
  const testBtn = document.getElementById("testBtn");
  const clearTestBtn = document.getElementById("clearTestBtn");

  refreshBtn.addEventListener("click", loadNextMatch);
  directTestBtn.addEventListener("click", showDirectNotification);
  testBtn.addEventListener("click", createTestMatch);
  clearTestBtn.addEventListener("click", clearTestMatches);

  await loadNextMatch();

  async function loadNextMatch() {
    matchBox.textContent = "Consultando API externa...";

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.RESCHEDULE
    });

    renderResponse(response);
  }

  async function showDirectNotification() {
    matchBox.textContent = "Mostrando notificación directa...";

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SHOW_DIRECT_NOTIFICATION
    });

    if (!response || !response.ok) {
      renderResponse(response);
      return;
    }

    matchBox.innerHTML = `
      <strong>Prueba enviada</strong>
      <p>${escapeHtml(response.message)}</p>
      <p>Si no aparece, revisa permisos de notificación en Chrome o en tu sistema operativo.</p>
    `;
  }

  async function createTestMatch() {
    matchBox.textContent = "Creando partido de prueba...";

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CREATE_TEST_MATCH
    });

    renderResponse(response);
  }

  async function clearTestMatches() {
    matchBox.textContent = "Borrando pruebas...";

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CLEAR_TEST_MATCHES
    });

    if (response && response.ok) {
      await loadNextMatch();
      return;
    }

    renderResponse(response);
  }

  function renderResponse(response) {
    if (!response || !response.ok) {
      matchBox.innerHTML = `
        <strong>Error</strong>
        <p>${escapeHtml(response?.error || "No se pudo obtener información.")}</p>
      `;
      return;
    }

    if (!response.nextMatch) {
      matchBox.innerHTML = `
        <strong>Sin partidos futuros</strong>
        <p>${escapeHtml(response.message || "La API no tiene partidos futuros disponibles.")}</p>
      `;
      return;
    }

    const match = response.nextMatch;

    matchBox.innerHTML = `
      <strong>${escapeHtml(match.homeTeam)} vs ${escapeHtml(match.awayTeam)}</strong>
      <p><b>Inicio:</b> ${escapeHtml(match.localTime)}</p>
      <p><b>Recordatorio:</b> ${escapeHtml(response.nextReminder || "10 minutos antes")}</p>
      <p><b>Grupo/Ronda:</b> ${escapeHtml(match.group || match.round || "No disponible")}</p>
      <p><b>Sede:</b> ${escapeHtml(match.ground || "No disponible")}</p>
      <p><b>Fuente:</b> ${escapeHtml(match.source || "API externa")}</p>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
