export class ChromeStorageRepository {
  async get(keys) {
    return await chrome.storage.local.get(keys);
  }

  async set(values) {
    await chrome.storage.local.set(values);
  }

  async remove(keys) {
    await chrome.storage.local.remove(keys);
  }
}
