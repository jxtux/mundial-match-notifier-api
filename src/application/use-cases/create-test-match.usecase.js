import { createTestMatch } from "../../domain/match/match-selector.js";
import { formatLocalTime } from "../../infrastructure/time/time.service.js";

export class CreateTestMatchUseCase {
  constructor(testMatchRepository, scheduleReminderUseCase) {
    this.testMatchRepository = testMatchRepository;
    this.scheduleReminderUseCase = scheduleReminderUseCase;
  }

  async execute() {
    const testMatch = createTestMatch();

    await this.testMatchRepository.add(testMatch);

    const reminder = await this.scheduleReminderUseCase.execute(testMatch);

    return {
      ok: true,
      nextMatch: reminder.match,
      nextReminder: formatLocalTime(reminder.reminderTime),
      message:
        "Partido de prueba creado. La notificación debe aparecer en 1 minuto."
    };
  }
}
