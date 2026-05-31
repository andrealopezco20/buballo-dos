# Buballo dos

Calendario web de eventos para BUBALLO EVENTS.

## Publicar en GitHub Pages con edicion/eliminacion

Este proyecto usa la opcion 2: **Supabase** desde frontend (sin servidor Node).

### 1) Crear tabla y politicas en Supabase

1. Abre el SQL Editor de tu proyecto Supabase.
2. Ejecuta el contenido de [data/supabase-schema.sql](data/supabase-schema.sql).

### 2) Configurar claves en frontend

1. Abre [js/config.js](js/config.js).
2. Reemplaza:
	- `supabaseUrl`
	- `supabaseAnonKey`
3. Cambia `adminUser` y `adminPassword` si quieres.

### 3) Subir a GitHub Pages

1. Haz commit y push de los cambios.
2. Activa GitHub Pages en tu repo (branch principal).
3. Abre `invitados.html` o `login.html` en la URL publicada.

## Notas

- Si no completas [js/config.js](js/config.js), la app cae a modo local (`localStorage`) y los cambios no se comparten entre usuarios.
- Las politicas del SQL estan abiertas para demo. Para produccion, limita acceso por autenticacion real.
