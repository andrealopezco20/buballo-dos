# Buballo dos

Calendario web de eventos para BUBALLO EVENTS.

## Publicar en GitHub Pages con edicion/eliminacion

Este proyecto usa Back4App (Parse REST) desde frontend, sin servidor Node.

### 1) Configurar Back4App en frontend

1. Abre [js/config.js](js/config.js).
2. Verifica estos valores:
	- back4appApiUrl
	- back4appAppId
	- back4appRestApiKey
	- back4appClassName (eventos)

### 2) Configurar claves en frontend

1. Abre [js/config.js](js/config.js).
2. Cambia adminUser y adminPassword si quieres.

### 3) Subir a GitHub Pages

1. Haz commit y push de los cambios.
2. Activa GitHub Pages en tu repo (branch principal).
3. Abre `invitados.html` o `login.html` en la URL publicada.

## Notas

- Si Back4App no esta configurado o falla, la app cae a modo local (localStorage) y los cambios no se comparten entre usuarios.
- Si compartiste la key de Back4App, regenerala en el panel por seguridad.
