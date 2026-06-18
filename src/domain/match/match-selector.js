export function findNextScheduledMatch(matches, now = Date.now()) {
  return matches
    .filter(match => match.status === "scheduled")
    .filter(match => {
      const kickoffTime = new Date(match.kickoff).getTime();
      return Number.isFinite(kickoffTime) && kickoffTime > now;
    })
    .sort((a, b) => {
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    })[0];
}

export function createTestMatch(now = Date.now()) {
  return {
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
}
