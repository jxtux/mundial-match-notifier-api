import {
  REMINDER_PREFIX,
  TEN_MINUTES_MS
} from "../../config/constants.js";

import {
  formatLocalTime,
  getReminderTime
} from "../../infrastructure/time/time.service.js";

export class ScheduleReminderUseCase {
  constructor(storageRepository, alarmService) {
    this.storageRepository = storageRepository;
    this.alarmService = alarmService;
  }

  async execute(match) {
    const reminderTime = getReminderTime(match.kickoff, TEN_MINUTES_MS);
    const alarmName = `${REMINDER_PREFIX}${match.id}`;
    const formattedMatch = this.formatMatch(match);

    await this.storageRepository.set({
      [alarmName]: formattedMatch,
      nextMatch: formattedMatch,
      nextReminder: new Date(reminderTime).toISOString()
    });

    if (reminderTime <= Date.now()) {
      return {
        scheduled: false,
        alarmName,
        reminderTime,
        match: formattedMatch
      };
    }

    const existingAlarm = await this.alarmService.get(alarmName);

    if (!existingAlarm) {
      await this.alarmService.create(alarmName, {
        when: reminderTime
      });
    }

    return {
      scheduled: true,
      alarmName,
      reminderTime,
      match: formattedMatch
    };
  }

  formatMatch(match) {
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
      localTime: formatLocalTime(match.kickoff)
    };
  }
}
