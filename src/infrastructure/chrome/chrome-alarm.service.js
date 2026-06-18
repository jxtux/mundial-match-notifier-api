export class ChromeAlarmService {
  async get(name) {
    return await chrome.alarms.get(name);
  }

  async create(name, options) {
    await chrome.alarms.create(name, options);
  }

  async clear(name) {
    await chrome.alarms.clear(name);
  }
}
