import { API_URL } from "../../config/constants.js";
import { formatLocalTime } from "../../infrastructure/time/time.service.js";

export class GetNextMatchInfoUseCase {
  constructor(getNextMatchUseCase, scheduleReminderUseCase, storageRepository) {
    this.getNextMatchUseCase = getNextMatchUseCase;
    this.scheduleReminderUseCase = scheduleReminderUseCase;
    this.storageRepository = storageRepository;
  }

  async execute() {
    const nextMatch = await this.getNextMatchUseCase.execute();

    if (!nextMatch) {
      await this.storageRepository.set({
        nextMatch: null,
        nextReminder: null
      });

      return {
        ok: true,
        nextMatch: null,
        nextReminder: null,
        message: "No hay partidos futuros disponibles en la API."
      };
    }

    const reminder = await this.scheduleReminderUseCase.execute(nextMatch);

    return {
      ok: true,
      apiUrl: API_URL,
      nextMatch: reminder.match,
      nextReminder: formatLocalTime(reminder.reminderTime)
    };
  }
}
