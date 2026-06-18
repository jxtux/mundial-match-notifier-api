export class ChromeNotificationService {
  async showMatchReminder(match) {
    return await this.showNotification({
      id: `notification-${match.id}`,
      title: "Partido del Mundial en 10 minutos",
      message: `${match.homeTeam} vs ${match.awayTeam} empieza a las ${match.localTime}`
    });
  }

  async showDirectTestNotification() {
    return await this.showNotification({
      id: `direct-test-${Date.now()}`,
      title: "Prueba directa de notificación",
      message: "Si ves esto, chrome.notifications funciona correctamente."
    });
  }

  async showNotification({ id, title, message }) {
    const permissionLevel = await chrome.notifications.getPermissionLevel();

    if (permissionLevel !== "granted") {
      throw new Error(
        `Chrome no permite mostrar notificaciones. Estado actual: ${permissionLevel}`
      );
    }

    const notificationId = await chrome.notifications.create(id, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon128.png"),
      title,
      message,
      priority: 2
    });

    console.log("Notificación creada:", notificationId);

    return notificationId;
  }
}
