export class TestMatchRepository {
  constructor(storageRepository) {
    this.storageRepository = storageRepository;
    this.storageKey = "testMatches";
  }

  async getAll() {
    const saved = await this.storageRepository.get(this.storageKey);
    return saved[this.storageKey] || [];
  }

  async add(match) {
    const testMatches = await this.getAll();

    await this.storageRepository.set({
      [this.storageKey]: [...testMatches, match]
    });
  }

  async clear() {
    await this.storageRepository.remove(this.storageKey);
  }
}
