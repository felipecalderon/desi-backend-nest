# 🏪 D3SI ERP - Sistema de Gestión Empresarial

Sistema ERP moderno desarrollado con NestJS para la gestión integral de tiendas, inventarios, ventas y usuarios. Diseñado para manejar operaciones de tiendas centrales, franquicias y puntos de venta con control completo de stock y precios.

## 🚀 Características Principales

### 📦 Gestión de Productos
- **Productos con Variaciones**: SKU único, precios de costo y lista, stock centralizado
- **Categorías Jerárquicas**: Soporte para categorías y subcategorías anidadas
- **Control de Inventario**: Seguimiento en tiempo real del stock disponible

### 🏢 Gestión de Tiendas
- **Múltiples Tipos**: Central, Franquicia, Consignación, Terceros
- **Inventario por Tienda**: Cada tienda mantiene su propio stock con precios personalizados
- **Transferencias de Stock**: Movimientos internos gratuitos entre tiendas
- **Ventas Inter-tiendas**: Sistema de ventas de central a franquicias con precios variables

### 💰 Sistema de Ventas
- **Ventas Transaccionales**: Registro completo de ventas con múltiples productos
- **Estados de Venta**: Pendiente, Pagado, Anulado
- **Métodos de Pago**: Efectivo, Débito, Crédito
- **Trazabilidad**: Historial completo de todas las transacciones

### 👥 Gestión de Usuarios
- **Asignación a Tiendas**: Usuarios pueden tener acceso a múltiples tiendas
- **Control de Acceso**: Gestión de permisos por tienda

## 🛠️ Stack Tecnológico

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Runtime**: Node.js con TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM con sincronización automática
- **Servidor HTTP**: Fastify (alto rendimiento)
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator & class-transformer

## 📋 Requisitos Previos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- pnpm (recomendado) o npm

## ⚙️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/felipecalderon/desi-backend-nest
cd desi-backend-nest
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# Database
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu_password
PGDATABASE=nombre_bd
```

4. **Iniciar la base de datos**

Asegúrate de que PostgreSQL esté corriendo y la base de datos creada:

```sql
CREATE DATABASE nombre_bd;
```

5. **Ejecutar la aplicación**

```bash
# Desarrollo con hot-reload
pnpm start:dev

# Producción
pnpm build
pnpm start:prod
```

## 📚 Documentación API

Una vez iniciada la aplicación, accede a la documentación interactiva de Swagger:

```
http://localhost:3001/docs
```

## 🗂️ Estructura del Proyecto

```
src/
├── categories/          # Gestión de categorías de productos
├── common/             # DTOs y utilidades compartidas
├── datasource/         # Configuración de base de datos
├── products/           # Gestión de productos y variaciones
├── relations/          
│   ├── store-stock/    # Inventario por tienda (StoreProduct)
│   └── userstores/     # Relación usuarios-tiendas
├── sales/              # Sistema de ventas
├── stores/             # Gestión de tiendas
└── users/              # Gestión de usuarios
```

## 🔄 Flujo de Operaciones

### 1. Crear Producto en Central
```http
POST /products
{
  "name": "Camisa Polo",
  "description": "Camisa de algodón",
  "categoryID": "uuid",
  "variations": [
    {
      "sku": "CAM-ROJ-L-001",
      "priceCost": 15000,
      "priceList": 25000,
      "stock": 100,
      "color": "Rojo",
      "size": "L"
    }
  ]
}
```

### 2. Transferir Stock a Franquicia (Gratuito)
```http
POST /store-stock/transfer
{
  "targetStoreID": "uuid-franquicia",
  "items": [
    {
      "variationID": "uuid-variacion",
      "quantity": 10,
      "purchaseCost": 15000
    }
  ]
}
```

### 3. Vender de Central a Franquicia
```http
POST /sales
{
  "storeID": "uuid-franquicia",
  "paymentType": "Credito",
  "items": [
    {
      "variationID": "uuid-variacion",
      "quantity": 10,
      "unitPrice": 18000
    }
  ]
}
```

### 4. Actualizar Precio de Venta en Franquicia
```http
PATCH /store-stock/{storeProductID}/price
{
  "salePrice": 30000
}
```

## 🎯 Endpoints Principales

### Productos
- `GET /products` - Listar productos (con paginación)
- `POST /products` - Crear producto
- `GET /products/:id` - Obtener producto
- `PATCH /products/:id` - Actualizar producto
- `DELETE /products/:id` - Eliminar producto

### Tiendas
- `GET /stores` - Listar tiendas
- `POST /stores` - Crear tienda
- `GET /stores/:id/users` - Usuarios de una tienda

### Ventas
- `POST /sales` - Crear venta
- `GET /sales` - Listar ventas
- `GET /sales/:id` - Detalle de venta
- `PATCH /sales/:id/status` - Cambiar estado

### Stock de Tiendas
- `POST /store-stock/transfer` - Transferir stock
- `GET /store-stock/inventory?storeID=uuid` - Ver inventario
- `PATCH /store-stock/:id/price` - Actualizar precio

## 🔐 Seguridad

- Validación de datos con `class-validator`
- Transacciones atómicas para operaciones críticas
- Bloqueo pesimista en actualizaciones de stock
- Validación de stock antes de transferencias/ventas

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📊 Base de Datos

El sistema utiliza TypeORM con sincronización automática. Las entidades principales son:

- **Product** & **ProductVariation**: Productos y sus variaciones
- **Store**: Tiendas del sistema
- **StoreProduct**: Inventario específico por tienda
- **Sale** & **SaleProduct**: Ventas y sus detalles
- **User** & **UserStore**: Usuarios y sus asignaciones
- **Category**: Categorías jerárquicas

### ⚠️ Resetear Base de Datos (Solo Desarrollo)

Para empezar con una base de datos limpia, descomenta la línea en `src/datasource/database.module.ts`:

```typescript
dropSchema: true, // ⚠️ ELIMINA TODAS LAS TABLAS
```

**IMPORTANTE**: Vuelve a comentar esta línea después del primer inicio para no perder datos.

## 🚀 Despliegue

### Variables de Entorno en Producción

```env
NODE_ENV=production
PGHOST=tu-host-produccion
PGPORT=5432
PGUSER=usuario_prod
PGPASSWORD=password_seguro
PGDATABASE=desi_erp_prod
```

### Build para Producción

```bash
pnpm build
pnpm start:prod
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ para la gestión eficiente de tiendas y franquicias.

---

**Documentación API**: http://localhost:3000/docs
