# Control de Laboratorio: frontend

Interfaz web (React + Vite + shadcn/ui) del sistema de inventario de componentes. Funciona con el backend **[web-2-backend](https://github.com/EliabParra/web-2-backend)** y solo hace peticiones al mismo origen: `GET /csrf`, `POST /login`, `POST /logout` y `POST /toProccess` (`{ tx, params }`).

## Instalar

Este repositorio no se instala por separado: el instalador del backend descarga los dos repositorios, compila el frontend y lo sirve en el mismo puerto que la API. Instrucciones en el [README del backend](https://github.com/EliabParra/web-2-backend#instalar).

## Actualizar

Las instalaciones se actualizan ejecutando el mismo comando de instalación del backend: descarga lo último de `master` de los dos repositorios y conserva los datos. Si agregas un método nuevo en un BO del backend, su número de transacción va en `scripts/db/tx-map.json` (backend) y en `src/api/tx.ts` (aquí), con el mismo valor. Reglas completas en la [guía de desarrollo del backend](https://github.com/EliabParra/web-2-backend/blob/master/docs/DEV.md#cambios-que-llegan-a-instalaciones-existentes).

## Desarrollar

Requisitos: Node.js 20+ y npm.

1. Levanta el backend en `http://localhost:3000` (ver `docs/DEV.md` del backend).
2. Levanta el frontend:

   ```sh
   npm ci
   npm run dev
   ```

3. Abre `http://localhost:5173`. Vite redirige `/toProccess`, `/login`, `/logout` y `/csrf` a `http://localhost:3000`, así que el navegador ve un solo origen y la cookie de sesión funciona.

Inicia sesión con un usuario del backend (en desarrollo, `admin` / `admin123` si seguiste `docs/DEV.md`).

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo con el proxy al backend |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Tests unitarios (Vitest) |
| `npm run lint` | ESLint |

`VITE_API_URL` es opcional (por defecto vacío, mismo origen). Solo se define si la API vive en otro origen.

## Mapa del código

- `src/api/client.ts`: cliente HTTP con el token CSRF, `post()` y `tx()`. Un 401 cierra la sesión; un 403 solo indica falta de permisos.
- `src/api/tx.ts`: números de transacción. Deben coincidir con `scripts/db/tx-map.json` del backend; un método nuevo se agrega en los dos archivos con el mismo número.
- `src/hooks/useTx.ts`: `useTx()` para lecturas y `runTx()` para escrituras con notificaciones.
- `src/contexts/AuthContext.tsx`: login y logout; el usuario se guarda en `localStorage` y se borra cuando el backend rechaza la sesión.
- `src/components/modules/`: una pantalla por módulo (`negocio/` y `seguridad/` para administración).
