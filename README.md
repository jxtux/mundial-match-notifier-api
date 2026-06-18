# Mundial Match Notifier API

Extensión local de Chrome que consume una API externa pública del Mundial 2026 y muestra una notificación 10 minutos antes del próximo partido.

## API usada

Usa el JSON público de OpenFootball:

https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json

No requiere token ni API key.

## Cómo instalar localmente

1. Descomprime este proyecto.
2. Abre Chrome.
3. Entra a `chrome://extensions`.
4. Activa `Modo desarrollador`.
5. Haz clic en `Cargar descomprimida`.
6. Selecciona la carpeta descomprimida.

## Cómo probar la notificación

Abre el popup de la extensión y presiona:

`Probar notificación en 1 minuto`

Esto crea un partido ficticio que empieza en 11 minutos, por lo que la notificación se muestra 10 minutos antes, es decir, en 1 minuto.

## Archivos principales

- `manifest.json`: permisos y configuración de la extensión.
- `service-worker.js`: consulta la API, detecta el próximo partido y programa alarmas.
- `popup.html`: interfaz del popup.
- `popup.js`: conecta la interfaz con el service worker.
- `styles.css`: estilos del popup.
