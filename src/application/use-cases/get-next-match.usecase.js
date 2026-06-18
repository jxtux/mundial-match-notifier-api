import { findNextScheduledMatch } from "../../domain/match/match-selector.js";

export class GetNextMatchUseCase {
  constructor(matchRepository) {
    this.matchRepository = matchRepository;
  }

  async execute() {
    const matches = await this.matchRepository.getAllMatches();
    return findNextScheduledMatch(matches);
  }
}
