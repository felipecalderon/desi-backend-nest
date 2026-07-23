# Deploy en Railway

Este proyecto utiliza dos entornos persistentes e independientes:

| Entorno Railway | Rama Git | Propósito                      | Haulmer |
| --------------- | -------- | ------------------------------ | ------- |
| `production`    | `main`   | API estable                    | No      |
| `dev`           | `dev`    | Pruebas similares a producción | Sí      |

Cada entorno debe tener su propio servicio de API, PostgreSQL, variables y
dominio. No se deben compartir las credenciales de base de datos entre los
entornos.

## Configuración del servicio API

En cada entorno, abrir el servicio API y configurar:

1. En **Settings > Source**, conectar este repositorio.
2. En `production`, seleccionar la rama `main`.
3. En `dev`, seleccionar la rama `dev`.
4. Mantener vacío **Root Directory**, porque el `Dockerfile` está en la raíz.
5. No definir un **Start Command**: se utiliza el `CMD` del `Dockerfile`.
6. Activar los despliegues automáticos desde la rama correspondiente.

El archivo `railway.json` hace que Railway utilice el `Dockerfile` y compruebe
`GET /health` antes de activar un despliegue.

## Variables del servicio API

Configurar las siguientes variables en el servicio API de cada entorno:

```env
PORT=3001
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=${{Postgres.PGDATABASE}}
JWT_SECRET=<secreto-del-entorno>
JWT_EXPIRES_IN=24h
```

Solo en el entorno `dev`, agregar:

```env
OPENFACTURA_APIKEY=<apikey-de-pruebas>
OPENFACTURA_BASE_URL=https://dev-api.haulmer.com
```

`PORT` corresponde al servidor HTTP de Nest. `PGPORT` corresponde a PostgreSQL.
Nunca se debe usar `5432` como puerto del dominio HTTP salvo que Nest haya sido
configurado explícitamente para escuchar allí.

## Dominio público

En **Settings > Networking > Public Networking**, el dominio de la API debe
apuntar al puerto `3001`.

Si el dominio muestra `Port 5432`:

1. Presionar el icono de editar junto al dominio.
2. Cambiar el puerto objetivo a `3001`.
3. Guardar y volver a desplegar el servicio.

No se debe crear un TCP Proxy para la API. Los TCP Proxy son para servicios que
no usan HTTP, como PostgreSQL.

## Verificación

Después del despliegue:

```http
GET https://<dominio-del-entorno>/health
```

Debe responder HTTP `200` con una respuesta que contenga:

```json
{
  "status": "ok"
}
```

La respuesta global de la API puede envolver ese objeto con campos adicionales.
Luego se puede usar el mismo dominio como `baseUrl` en Postman, sin una barra
final:

```text
https://<dominio-del-entorno>
```

Si `/health` devuelve `502`, revisar primero el puerto objetivo y después los
Deploy Logs. El inicio correcto incluye un mensaje similar a:

```text
Application listening on http://0.0.0.0:3001
```
