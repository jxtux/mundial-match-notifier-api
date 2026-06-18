import {
  CHECK_ALARM,
  POLL_PERIOD_MINUTES,
  REMINDER_PREFIX
} from "../config/constants.js";

import { MESSAGE_TYPES } from "../shared/message-types.js";

import { OpenFootballApiClient } from "../infrastructure/api/openfootball-api.client.js";
import { ChromeAlarmService } from "../infrastructure/chrome/chrome-alarm.service.js";
import { ChromeNotificationService } from "../infrastructure/chrome/chrome-notification.service.js";
import { ChromeStorageRepository } from "../infrastructure/chrome/chrome-storage.repository.js";
import { MatchRepository } from "../infrastructure/repositories/match.repository.js";
import { TestMatchRepository } from "../infrastructure/repositories/test-match.repository.js";

import { GetNextMatchUseCase } from "../application/use-cases/get-next-match.usecase.js";
import { GetNextMatchInfoUseCase } from "../application/use-cases/get-next-match-info.usecase.js";
import { ScheduleReminderUseCase } from "../application/use-cases/schedule-reminder.usecase.js";
import { CreateTestMatchUseCase } from "../application/use-cases/create-test-match.usecase.js";
import { ClearTestMatchesUseCase } from "../application/use-cases/clear-test-matches.usecase.js";

/*
  service-worker.js
  Capa de entrada/background de la extensión.

  No contiene toda la lógica de negocio directamente.
  Solo coordina eventos de Chrome y delega el trabajo a los casos de uso.
*/

const storageRepository = new ChromeStorageRepository();
const alarmService = new ChromeAlarmService();
const notificationService = new ChromeNotificationService();

const apiClient = new OpenFootballApiClient();
const testMatchRepository = new TestMatchRepository(storageRepository);
const matchRepository = new MatchRepository(apiClient, testMatchRepository);

const scheduleReminderUseCase = new ScheduleReminderUseCase(
  storageRepository,
  alarmService
);

const getNextMatchUseCase = new GetNextMatchUseCase(matchRepository);

const getNextMatchInfoUseCase = new GetNextMatchInfoUseCase(
  getNextMatchUseCase,
  scheduleReminderUseCase,
  storageRepository
);

const createTestMatchUseCase = new CreateTestMatchUseCase(
  testMatchRepository,
  scheduleReminderUseCase
);

const clearTestMatchesUseCase = new ClearTestMatchesUseCase(
  testMatchRepository,
  storageRepository,
  alarmService
);

chrome.runtime.onInstalled.addListener(async () => {
  await setupPeriodicCheck();
  await checkNextMatch();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupPeriodicCheck();
  await checkNextMatch();
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === CHECK_ALARM) {
    await checkNextMatch();
    return;
  }

  if (alarm.name.startsWith(REMINDER_PREFIX)) {
    await notifyMatchReminder(alarm.name);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => {
      console.error("Error procesando mensaje:", error);

      sendResponse({
        ok: false,
        error: error.message
      });
    });

  // Mantiene abierto el canal para responder de forma asíncrona.
  return true;
});

async function setupPeriodicCheck() {
  const existing = await alarmService.get(CHECK_ALARM);

  if (!existing) {
    await alarmService.create(CHECK_ALARM, {
      periodInMinutes: POLL_PERIOD_MINUTES
    });
  }
}

async function checkNextMatch() {
  await getNextMatchInfoUseCase.execute();
}

async function notifyMatchReminder(alarmName) {
  const saved = await storageRepository.get(alarmName);
  const match = saved[alarmName];

  if (!match) return;

  await notificationService.showMatchReminder(match);
  await storageRepository.remove(alarmName);
}

async function handleMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.GET_NEXT_MATCH:
    case MESSAGE_TYPES.RESCHEDULE:
      return await getNextMatchInfoUseCase.execute();

    case MESSAGE_TYPES.CREATE_TEST_MATCH:
      return await createTestMatchUseCase.execute();

    case MESSAGE_TYPES.CLEAR_TEST_MATCHES:
      return await clearTestMatchesUseCase.execute();

    case MESSAGE_TYPES.SHOW_DIRECT_NOTIFICATION:
      await notificationService.showDirectTestNotification();
      return {
        ok: true,
        message: "Notificación directa solicitada."
      };

    default:
      return {
        ok: false,
        error: `Tipo de mensaje no soportado: ${message.type}`
      };
  }
}
