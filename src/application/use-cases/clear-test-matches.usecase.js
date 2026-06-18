import { REMINDER_PREFIX } from "../../config/constants.js";

export class ClearTestMatchesUseCase {
  constructor(testMatchRepository, storageRepository, alarmService) {
    this.testMatchRepository = testMatchRepository;
    this.storageRepository = storageRepository;
    this.alarmService = alarmService;
  }

  async execute() {
    const testMatches = await this.testMatchRepository.getAll();

    for (const match of testMatches) {
      const alarmName = `${REMINDER_PREFIX}${match.id}`;

      await this.alarmService.clear(alarmName);
      await this.storageRepository.remove(alarmName);
    }

    await this.testMatchRepository.clear();

    return {
      ok: true,
      message: "Partidos de prueba eliminados."
    };
  }
}
