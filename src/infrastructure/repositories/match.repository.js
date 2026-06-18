export class MatchRepository {
  constructor(apiClient, testMatchRepository) {
    this.apiClient = apiClient;
    this.testMatchRepository = testMatchRepository;
  }

  async getAllMatches() {
    const apiMatches = await this.apiClient.getMatches();
    const testMatches = await this.testMatchRepository.getAll();

    return [...testMatches, ...apiMatches];
  }
}
