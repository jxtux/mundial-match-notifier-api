# Mundial Match Notifier API - Layered

Extensión local de Chrome organizada con una estructura más profesional por capas.

## Idea arquitectónica

El estilo principal del trabajo sigue siendo **Microkernel**:

- **Google Chrome** actúa como microkernel o núcleo.
- La extensión **Mundial Match Notifier API** funciona como plugin agregado.
- El plugin usa APIs de Chrome: `runtime`, `alarms`, `storage` y `notifications`.
- La fuente externa de datos es OpenFootball.

Internamente, el plugin se organizó por capas para separar responsabilidades.

## Estructura

```text
mundial-match-notifier-api-layered/
├── manifest.json
├── assets/
│   └── icon128.png
└── src/
    ├── background/
    │   └── service-worker.js
    ├── config/
    │   └── constants.js
    ├── shared/
    │   └── message-types.js
    ├── domain/
    │   └── match/
    │       └── match-selector.js
    ├── application/
    │   └── use-cases/
    │       ├── get-next-match.usecase.js
    │       ├── get-next-match-info.usecase.js
    │       ├── schedule-reminder.usecase.js
    │       ├── create-test-match.usecase.js
    │       └── clear-test-matches.usecase.js
    ├── infrastructure/
    │   ├── api/
    │   │   └── openfootball-api.client.js
    │   ├── chrome/
    │   │   ├── chrome-alarm.service.js
    │   │   ├── chrome-notification.service.js
    │   │   └── chrome-storage.repository.js
    │   ├── repositories/
    │   │   ├── match.repository.js
    │   │   └── test-match.repository.js
    │   └── time/
    │       └── time.service.js
    └── presentation/
        └── popup/
            ├── popup.html
            ├── popup.js
            └── popup.css
```

## Capas

### 1. Presentación

Ubicación:

```text
src/presentation/popup/
```

Responsabilidad:

- Mostrar la interfaz del popup.
- Escuchar botones.
- Enviar mensajes al `service-worker.js`.

Archivos:

- `popup.html`
- `popup.js`
- `popup.css`

### 2. Background / Entrada de eventos Chrome

Ubicación:

```text
src/background/service-worker.js
```

Responsabilidad:

- Escuchar eventos de Chrome.
- Recibir mensajes del popup.
- Coordinar casos de uso.
- No contiene toda la lógica directamente; delega a la capa de aplicación.

### 3. Aplicación / Casos de uso

Ubicación:

```text
src/application/use-cases/
```

Responsabilidad:

- Resolver acciones concretas del sistema:
  - obtener próximo partido;
  - programar recordatorio;
  - crear partido de prueba;
  - borrar pruebas.

### 4. Dominio

Ubicación:

```text
src/domain/
```

Responsabilidad:

- Contener reglas propias del problema.
- Por ejemplo, seleccionar el próximo partido programado.

### 5. Infraestructura

Ubicación:

```text
src/infrastructure/
```

Responsabilidad:

- Conectarse con APIs externas.
- Usar APIs de Chrome.
- Manejar almacenamiento.
- Convertir fechas y horarios.

## Cómo instalar localmente

1. Descomprime el ZIP.
2. Abre Chrome.
3. Entra a `chrome://extensions`.
4. Activa `Modo desarrollador`.
5. Clic en `Cargar descomprimida`.
6. Selecciona la carpeta `mundial-match-notifier-api-layered`.

## Cómo probar

Presiona el botón:

```text
Probar notificación en 1 minuto
```

El sistema crea un partido ficticio que empieza en 11 minutos, por eso la notificación aparece 10 minutos antes, es decir, en 1 minuto.


## Prueba de diagnóstico agregada

Esta versión incluye el botón:

```text
Notificación directa ahora
```

Ese botón no espera alarmas ni partidos. Llama directamente a `chrome.notifications.create`.

- Si aparece: las notificaciones funcionan y el problema puede estar en alarmas o datos.
- Si no aparece: revisar permisos de notificaciones de Chrome o del sistema operativo.
