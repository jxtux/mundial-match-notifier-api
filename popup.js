document.addEventListener("DOMContentLoaded", async () => {
  const matchBox = document.getElementById("matchBox");
  const refreshBtn = document.getElementById("refreshBtn");
  const testBtn = document.getElementById("testBtn");
  const clearTestBtn = document.getElementById("clearTestBtn");

  refreshBtn.addEventListener("click", loadNextMatch);
  testBtn.addEventListener("click", createTestMatch);
  clearTestBtn.addEventListener("click", clearTestMatches);

  await loadNextMatch();

  async function loadNextMatch() {
    matchBox.textContent = "Consultando API externa...";

    const response = await chrome.runtime.sendMessage({
      type: "RESCHEDULE"
    });

    renderResponse(response);
  }

  async function createTestMatch() {
    matchBox.textContent = "Creando partido de prueba...";

    const response = await chrome.runtime.sendMessage({
      type: "CREATE_TEST_MATCH"
    });

    renderResponse(response);
  }

  async function clearTestMatches() {
    matchBox.textContent = "Borrando pruebas...";

    const response = await chrome.runtime.sendMessage({
      type: "CLEAR_TEST_MATCHES"
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
        <p>${response?.error || "No se pudo obtener información."}</p>
      `;
      return;
    }

    if (!response.nextMatch) {
      matchBox.innerHTML = `
        <strong>Sin partidos futuros</strong>
        <p>${response.message || "La API no tiene partidos futuros disponibles."}</p>
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
