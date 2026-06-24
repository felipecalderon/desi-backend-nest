# Implementacion multitenant por tienda

Este documento resume los cambios realizados para soportar un esquema multitenant basado en tienda activa (`storeID`) y roles por tienda.

## Objetivo

Evitar que datos operativos de una tienda se mezclen o puedan consultarse desde otra tienda.

La regla aplicada es:

```text
Toda operacion operativa debe ejecutarse dentro de una tienda activa.
```

La tienda activa se envia desde el cliente en el header:

```http
x-store-id: <storeID>
```

## Modelo de roles

Se agregaron roles nuevos:

- `super_admin`
- `owner`
- `admin`
- `store_manager`
- `consignado`
- `tercero`

El rol global sigue existiendo en `Users.role`, pero ahora el rol operativo por tienda vive en la relacion:

```text
UserStore = user + store + role
```

Esto permite casos como:

```text
Ana = owner en Tienda 2
Ana = store_manager en Tienda 3
Luis = manager en Tienda 1
Luis = tercero en Tienda 2
```

## Super admin

El `super_admin` es global.

Puede:

- Crear tiendas.
- Crear usuarios.
- Asignar usuarios a tiendas.
- Entrar a cualquier tienda usando `x-store-id`.
- Ver listados globales cuando el endpoint lo permite y no manda `x-store-id`.

Para crear automaticamente un usuario master al iniciar la app se agregaron estas variables:

```env
MASTER_ADMIN_EMAIL=admin@demo.com
MASTER_ADMIN_PASSWORD=passwordSeguro
MASTER_ADMIN_NAME=Master
```

Si esas variables existen y el usuario no existe, el sistema lo crea con rol `super_admin`.

## Login

El login ahora devuelve las tiendas asignadas al usuario y su rol dentro de cada una.

Ejemplo conceptual:

```json
{
  "user": {
    "id": "user-id",
    "email": "miguel@example.com",
    "name": "Miguel",
    "role": "owner",
    "stores": [
      {
        "storeID": "store-1",
        "name": "Tienda 1",
        "role": "owner"
      }
    ]
  },
  "accessToken": "jwt"
}
```

El frontend debe permitir seleccionar una tienda y mandar esa tienda activa en cada request operativa.

## Headers requeridos

Para operaciones de tienda:

```http
Authorization: Bearer <token>
x-store-id: <storeID activo>
```

Si un usuario normal manda un `x-store-id` que no pertenece a sus tiendas, el backend responde `403`.

Si un usuario normal intenta pedir datos de otra tienda usando params/query/body, el backend tambien bloquea la request.

## Guards actualizados

### AuthGuard

Ahora valida:

- Token valido.
- Tienda activa en `x-store-id`.
- Que el usuario normal pertenezca a esa tienda.
- Que `storeID` o `storeId` en params/query/body coincida con la tienda activa.

El `super_admin` puede pasar globalmente.

### RolesGuard

Ahora valida roles por tienda.

Antes:

```text
request.user.role
```

Ahora:

```text
request.user.stores[].role segun x-store-id
```

El `super_admin` pasa cualquier validacion de roles.

## Modulos protegidos por tienda activa

Se agrego filtrado/alcance por tienda activa en:

- Ventas
- Gastos
- Ordenes de compra
- Inventario
- Productos
- Productos por tienda
- Precios
- Ofertas
- Reportes
- Metas mensuales
- Transferencias
- Tiendas
- Usuarios
- Asignaciones usuario-tienda

## Cambios por area

### Usuarios

- `CreateUserDto` acepta `storeID`.
- Usuarios normales requieren tienda.
- `super_admin` puede existir sin tienda.
- `findAll`, `findOne`, `update`, `remove` se filtran por tienda para usuarios normales.
- El endpoint de crear usuario ya no es publico.

### UserStore

La relacion usuario-tienda ahora incluye:

```ts
role: UserRole
```

Esto vuelve al modelo:

```text
user_id + store_id + role
```

### Ventas

- Crear venta usa la tienda activa.
- Listar ventas filtra por tienda activa.
- Ver detalle y cambiar estado solo permite ventas de la tienda activa.

### Inventario

- Movimiento manual usa la tienda activa.
- Consulta de stock usa la tienda activa.

### Productos

- Listado de productos carga `storeProducts` solo de la tienda activa.
- Crear producto crea stock inicial en la tienda activa.
- Actualizar producto afecta el `StoreProduct` de la tienda activa.

### Ordenes de compra

- Crear orden usa la tienda activa.
- Listar, ver, actualizar, cambiar estado y verificar quedan filtrados por tienda activa.

### Gastos

- Crear gasto usa la tienda activa.
- Listar, resumen, detalle, actualizar y eliminar quedan filtrados por tienda activa.

### Reportes

- `income-statement` fuerza `storeId` desde `x-store-id`.
- `sales` fuerza `storeId` desde `x-store-id`.

### Transferencias

- La tienda activa participa como origen.
- El usuario solo puede ver u operar transferencias donde la tienda activa sea origen o destino.

### Seed

El endpoint `seed` dejo de ser publico.

Ahora requiere:

```ts
@Roles(UserRole.SUPER_ADMIN)
```

## Helper agregado

Se agrego:

```text
src/common/tenant/store-scope.util.ts
```

Incluye helpers para:

- Requerir tienda activa.
- Permitir alcance opcional para `super_admin`.
- Limitar a tienda activa para usuarios normales.

## Verificacion

Se ejecuto:

```bash
npm run build
npm test
```

Resultado:

```text
Build OK
13 test suites passed
87 tests passed
```

## Pendiente recomendado antes de produccion

Actualmente el proyecto sigue usando:

```ts
synchronize: true
```

Se recomienda cambiar a migraciones TypeORM antes de produccion:

```ts
synchronize: false
migrationsRun: true
```

Esto es importante porque se agregaron campos/enums y no conviene que TypeORM modifique la base automaticamente en ambientes productivos.
