import { API_URL } from "../../config/constants.js";
import { convertOpenFootballDateToISO } from "../time/time.service.js";

export class OpenFootballApiClient {
  async getMatches() {
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

    return data.matches
      .map((match, index) => this.mapToDomainMatch(match, index))
      .filter(Boolean);
  }

  mapToDomainMatch(match, index) {
    try {
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
    } catch (error) {
      console.warn("Partido omitido por datos inválidos:", match, error);
      return null;
    }
  }
}
