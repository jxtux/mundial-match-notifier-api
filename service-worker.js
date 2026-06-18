const API_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const CHECK_ALARM = "check-next-match";
const REMINDER_PREFIX = "match-reminder-";
const TEN_MINUTES = 10 * 60 * 1000;

chrome.runtime.onInstalled.addListener(async () => {
  await setupPeriodicCheck();
  await checkNextMatch();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupPeriodicCheck();
  await checkNextMatch();
});

async function setupPeriodicCheck() {
  const existing = await chrome.alarms.get(CHECK_ALARM);

  if (!existing) {
    await chrome.alarms.create(CHECK_ALARM, {
      periodInMinutes: 30
    });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === CHECK_ALARM) {
    await checkNextMatch();
    return;
  }

  if (alarm.name.startsWith(REMINDER_PREFIX)) {
    const saved = await chrome.storage.local.get(alarm.name);
    const match = saved[alarm.name];

    if (!match) return;

    await chrome.notifications.create(`notification-${match.id}`, {
      type: "basic",
      iconUrl: "icon128.png",
      title: "Partido del Mundial en 10 minutos",
      message: `${match.homeTeam} vs ${match.awayTeam} empieza a las ${match.localTime}`
    });

    await chrome.storage.local.remove(alarm.name);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_NEXT_MATCH" || message.type === "RESCHEDULE") {
    getNextMatchInfo()
      .then(sendResponse)
      .catch(error => sendResponse({
        ok: false,
        error: error.message
      }));

    return true;
  }

  if (message.type === "CREATE_TEST_MATCH") {
    createTestMatch()
      .then(sendResponse)
      .catch(error => sendResponse({
        ok: false,
        error: error.message
      }));

    return true;
  }

  if (message.type === "CLEAR_TEST_MATCHES") {
    clearTestMatches()
      .then(sendResponse)
      .catch(error => sendResponse({
        ok: false,
        error: error.message
      }));

    return true;
  }
});

async function checkNextMatch() {
  const matches = await getAllMatches();
  const nextMatch = getNextMatch(matches);

  if (!nextMatch) {
    await chrome.storage.local.set({
      nextMatch: null,
      nextReminder: null
    });
    return;
  }

  await scheduleReminder(nextMatch);
}

async function getNextMatchInfo() {
  const matches = await getAllMatches();
  const nextMatch = getNextMatch(matches);

  if (!nextMatch) {
    return {
      ok: true,
      nextMatch: null,
      nextReminder: null,
      message: "No hay partidos futuros disponibles en la API."
    };
  }

  await scheduleReminder(nextMatch);

  const reminderTime = new Date(nextMatch.kickoff).getTime() - TEN_MINUTES;

  return {
    ok: true,
    apiUrl: API_URL,
    nextMatch: formatMatch(nextMatch),
    nextReminder: formatLimaTime(reminderTime)
  };
}

async function getAllMatches() {
  const apiMatches = await fetchMatchesFromApi();

  const saved = await chrome.storage.local.get("testMatches");
  const testMatches = saved.testMatches || [];

  return [...testMatches, ...apiMatches];
}

async function fetchMatchesFromApi() {
  const response = await fetch(API_URL, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("No se pudo consultar la API externa del Mundial.");
  }

  const data = await response.json();

  if (!data.matches || !Array.isArray(data.matches)) {
    throw new Error("La API no devolvió un arreglo de partidos válido.");
  }

  return data.matches.map((match, index) => {
    const kickoffISO = convertOpenFootballDateToISO(match.date, match.time);

    return {
      id: `wc-${index + 1}`,
      homeTeam: match.team1 || "Por definir",
      awayTeam: match.team2 || "Por definir",
      group: match.group || match.round || "Sin grupo",
      status: match.score ? "finished" : "scheduled",
      kickoff: kickoffISO,
      ground: match.ground || "Sede no disponible",
      round: match.round || "Ronda no disponible",
      source: "OpenFootball"
    };
  });
}

function getNextMatch(matches) {
  const now = Date.now();

  return matches
    .filter(match => match.status === "scheduled")
    .filter(match => {
      const time = new Date(match.kickoff).getTime();
      return Number.isFinite(time) && time > now;
    })
    .sort((a, b) => {
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    })[0];
}

async function scheduleReminder(match) {
  const kickoffTime = new Date(match.kickoff).getTime();
  const reminderTime = kickoffTime - TEN_MINUTES;
  const alarmName = `${REMINDER_PREFIX}${match.id}`;

  const localMatch = formatMatch(match);

  await chrome.storage.local.set({
    [alarmName]: localMatch,
    nextMatch: localMatch,
    nextReminder: new Date(reminderTime).toISOString()
  });

  if (reminderTime <= Date.now()) {
    return;
  }

  const existingAlarm = await chrome.alarms.get(alarmName);

  if (!existingAlarm) {
    await chrome.alarms.create(alarmName, {
      when: reminderTime
    });
  }
}

function formatMatch(match) {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    group: match.group,
    status: match.status,
    kickoff: match.kickoff,
    ground: match.ground,
    round: match.round,
    source: match.source || "API externa",
    localTime: formatLimaTime(match.kickoff)
  };
}

function formatLimaTime(dateValue) {
  return new Date(dateValue).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function convertOpenFootballDateToISO(date, time) {
  /*
    OpenFootball suele usar:
    date: "2026-06-18"
    time: "12:00 UTC-4"
  */

  if (!date || !time) {
    throw new Error("Partido sin fecha u hora válida.");
  }

  const timeWithOffset = time.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/);

  if (timeWithOffset) {
    const [, hourText, minuteText, offsetText] = timeWithOffset;

    const [year, month, day] = date.split("-").map(Number);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const offset = Number(offsetText);

    const utcMilliseconds = Date.UTC(
      year,
      month - 1,
      day,
      hour - offset,
      minute
    );

    return new Date(utcMilliseconds).toISOString();
  }

  const timeWithoutOffset = time.match(/(\d{1,2}):(\d{2})/);

  if (timeWithoutOffset) {
    const [, hourText, minuteText] = timeWithoutOffset;
    const [year, month, day] = date.split("-").map(Number);

    return new Date(Date.UTC(
      year,
      month - 1,
      day,
      Number(hourText),
      Number(minuteText)
    )).toISOString();
  }

  throw new Error(`Formato de hora no reconocido: ${time}`);
}

async function createTestMatch() {
  const now = Date.now();

  // Partido de prueba: empieza en 11 minutos.
  // Como la notificación es 10 minutos antes, debe aparecer en 1 minuto.
  const testMatch = {
    id: `test-${now}`,
    homeTeam: "Equipo Local",
    awayTeam: "Equipo Visitante",
    group: "Prueba",
    status: "scheduled",
    kickoff: new Date(now + 11 * 60 * 1000).toISOString(),
    ground: "Chrome Local",
    round: "Prueba de notificación",
    source: "Prueba local"
  };

  const saved = await chrome.storage.local.get("testMatches");
  const testMatches = saved.testMatches || [];

  await chrome.storage.local.set({
    testMatches: [...testMatches, testMatch]
  });

  await scheduleReminder(testMatch);

  return {
    ok: true,
    nextMatch: formatMatch(testMatch),
    nextReminder: formatLimaTime(Date.now() + 60 * 1000),
    message: "Partido de prueba creado. La notificación debe aparecer en 1 minuto."
  };
}

async function clearTestMatches() {
  const saved = await chrome.storage.local.get("testMatches");
  const testMatches = saved.testMatches || [];

  for (const match of testMatches) {
    await chrome.alarms.clear(`${REMINDER_PREFIX}${match.id}`);
    await chrome.storage.local.remove(`${REMINDER_PREFIX}${match.id}`);
  }

  await chrome.storage.local.remove("testMatches");
  await checkNextMatch();

  return {
    ok: true,
    message: "Partidos de prueba eliminados."
  };
}
