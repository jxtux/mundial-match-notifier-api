# Arquitectura profesional del proyecto

## Estilo principal

La arquitectura general es **Microkernel**.

```text
Google Chrome = Microkernel / Núcleo
Mundial Match Notifier API = Plugin / Extensión
OpenFootball API = Fuente externa de datos
```

## Organización interna

El plugin está organizado con una estructura por capas:

```text
Presentación
    ↓
Background / Entrada Chrome
    ↓
Aplicación / Casos de uso
    ↓
Dominio
    ↓
Infraestructura
```

## Flujo principal

```text
Usuario
  ↓
popup.html / popup.js
  ↓ chrome.runtime.sendMessage
service-worker.js
  ↓
GetNextMatchInfoUseCase
  ↓
MatchRepository
  ↓
OpenFootballApiClient
  ↓ fetch(API_URL)
API Externa de Datos
```

## Flujo de notificación

```text
GetNextMatchInfoUseCase
  ↓
ScheduleReminderUseCase
  ↓
ChromeAlarmService
  ↓
chrome.alarms.create(...)
  ↓
chrome.alarms.onAlarm
  ↓
ChromeNotificationService
  ↓
chrome.notifications.create(...)
```

## Relación con microkernel

Chrome no contiene la lógica del Mundial. Chrome ofrece servicios generales:

- permisos;
- almacenamiento;
- alarmas;
- notificaciones;
- ejecución del service worker;
- comunicación interna.

La extensión se instala como plugin y agrega la funcionalidad específica de consultar partidos del Mundial y notificar al usuario.
