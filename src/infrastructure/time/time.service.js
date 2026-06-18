import { LOCALE, TIME_ZONE } from "../../config/constants.js";

export function formatLocalTime(dateValue) {
  return new Date(dateValue).toLocaleString(LOCALE, {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getReminderTime(kickoff, minutesBeforeMs) {
  return new Date(kickoff).getTime() - minutesBeforeMs;
}

export function convertOpenFootballDateToISO(date, time) {
  /*
    OpenFootball suele usar:
    date: "2026-06-18"
    time: "12:00 UTC-4"
  */

  if (!date || !time) {
    throw new Error("Partido sin fecha u hora válida.");
  }

  const timeWithOffset = time.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/);

  if (timeWithOffset) {
    const [, hourText, minuteText, offsetText] = timeWithOffset;

    const [year, month, day] = date.split("-").map(Number);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const offset = Number(offsetText);

    const utcMilliseconds = Date.UTC(
      year,
      month - 1,
      day,
      hour - offset,
      minute
    );

    return new Date(utcMilliseconds).toISOString();
  }

  const timeWithoutOffset = time.match(/(\d{1,2}):(\d{2})/);

  if (timeWithoutOffset) {
    const [, hourText, minuteText] = timeWithoutOffset;
    const [year, month, day] = date.split("-").map(Number);

    return new Date(
      Date.UTC(year, month - 1, day, Number(hourText), Number(minuteText))
    ).toISOString();
  }

  throw new Error(`Formato de hora no reconocido: ${time}`);
}
