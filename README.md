# Finanzas Web

Frontend para gestionar finanzas personales. Permite crear una cuenta e iniciar sesión, consultar ingresos y egresos, y registrar, editar o eliminar movimientos.

La aplicación está construida con React 19 y Vite 8. Se conecta a un backend mediante una API HTTP y usa cookies y protección CSRF para la sesión.

## Requisitos

- Node.js **20.19 o posterior** o **22.12 o posterior**, según los [requisitos de Vite](https://vite.dev/guide/).
- npm **9 o posterior** para trabajar con el archivo de dependencias `package-lock.json`.
- Git, para clonar el repositorio.
- Una instancia activa del backend compatible con esta aplicación. El backend debe aceptar solicitudes desde el origen del frontend y permitir el uso de cookies con credenciales.
- Un navegador moderno.

Las versiones exactas de los paquetes instalados están fijadas en `package-lock.json`.

## Instalación

Clona el repositorio y entra en la carpeta del proyecto. Sustituye el marcador por la URL del repositorio:

```bash
git clone URL_DEL_REPOSITORIO
cd finanzas-web-japs
```

Instala las dependencias registradas en el lockfile:

```bash
npm ci
```

## Configurar la API

Crea un archivo local de configuración a partir de la plantilla:

```bash
cp .env.example .env.local
```

Edita `.env.local` y configura la URL base de la API:

```env
VITE_API_URL=<URL_BASE_DEL_API>/api
```

Reemplaza `<URL_BASE_DEL_API>` por la dirección base de tu backend. Incluye `/api` al final. Por ejemplo, si la API está publicada bajo una ruta base, conserva esa ruta antes de `/api`.

**Advertencia:** todas las variables con prefijo `VITE_` se incrustan en los archivos públicos del build y cualquier persona puede verlas en el navegador. No guardes contraseñas, tokens, claves privadas ni ningún otro secreto en ellas. `VITE_API_URL` debe contener únicamente la dirección pública de la API.

Si cambias la configuración mientras el servidor de desarrollo está activo, reinícialo para que Vite la vuelva a leer. Para producción, define `VITE_API_URL` antes de generar el build.

## Servidor de desarrollo

Desde la raíz del proyecto, ejecuta:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir en el navegador. De forma predeterminada suele usar el puerto `5173`; si está ocupado, seleccionará otro.

## Build de producción

Antes de compilar, crea `.env.production.local` en la raíz del proyecto con la dirección del API de producción:

```env
VITE_API_URL=<URL_BASE_DEL_API_DE_PRODUCCION>/api
```

Después genera el build:

```bash
npm run build
```

Vite genera los archivos estáticos de producción en `dist/`. Publica el contenido de esa carpeta en el servidor web o plataforma de hosting. La URL de la API queda incorporada al build, así que vuelve a generarlo si necesitas cambiarla.

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera el build de producción en `dist/`.
- `npm run preview`: sirve localmente el build generado para revisarlo.
- `npm run lint`: ejecuta ESLint.
