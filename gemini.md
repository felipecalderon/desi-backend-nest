# Contexto del Proyecto: Migración de Sistema Heredado a NestJS

## 1. Objetivo Principal

Este proyecto consiste en la reescritura y modernización de una aplicación heredada de Node.js y Sequelize. La nueva implementación utilizará **NestJS** y **TypeORM**, aplicando principios de **Domain-Driven Design (DDD)** para lograr una arquitectura modular, escalable y mantenible.

El objetivo es migrar la lógica de negocio y la estructura de la base de datos existentes, eliminando redundancias y mejorando la calidad general del código. El proyecto ya ha comenzado y cuenta con una estructura modular bien definida.

## 2. Estado Actual y Avances

El desarrollo ha progresado significativamente, estableciendo una base sólida que sigue los principios arquitectónicos definidos.

- **Estructura Modular**: La aplicación está organizada en módulos que representan contextos delimitados (Bounded Contexts) de DDD. Los módulos principales implementados son:
    - **Users**: Gestión de usuarios.
    - **Stores-module**: Un módulo agrupador que contiene:
        - **Stores**: Gestión de tiendas.
        - **UserStores**: Gestión de la relación entre usuarios y tiendas.
    - **Files**: Gestión de archivos.

- **Funcionalidades Implementadas**:
    - Creación y gestión de usuarios.
    - Creación y gestión de tiendas.
    - Vinculación de usuarios a tiendas.

- **Principios Arquitectónicos Aplicados**:
    - **Diseño Orientado al Dominio (DDD)**: Cada módulo (`Users`, `Stores`, `UserStores`) funciona como un contexto delimitado, con sus propias entidades, DTOs, servicios y controladores.
    - **Desacoplamiento y DTOs**: Se utilizan DTOs para la comunicación entre capas, evitando exponer las entidades de TypeORM directamente en la API.
    - **Manejo de Excepciones e Interceptores**: Se han implementado interceptores y filtros de excepciones globales para estandarizar las respuestas y el manejo de errores.

## 3. Próximos Pasos

La tarea principal es continuar implementando los dominios restantes de la aplicación, basándose en las relaciones y la estructura del sistema heredado. Esto incluye la creación de nuevos módulos, entidades, DTOs, servicios y controladores.

## 4. Contexto del Sistema Heredado (Fuente de Verdad)

Las siguientes relaciones, extraídas del sistema anterior basado en Sequelize, deben ser utilizadas como la **fuente de verdad** para definir las nuevas entidades de TypeORM y sus interconexiones.

```javascript
// Relaciones del antiguo sistema (Sequelize)
File.belongsTo(Store, { as: "store", foreignKey: "storeID"});
Categories.belongsTo(Categories, { as: "parent", foreignKey: "parentID"});
Categories.hasMany(Categories, { as: "Categories", foreignKey: "parentID"});
Categories.hasMany(Product, { as: "Products", foreignKey: "categoryID"});
Product.belongsTo(Categories, { as: "category", foreignKey: "categoryID"});
Product.hasMany(ProductVariation, { as: "ProductVariations", foreignKey: "productID"});
Order.hasMany(OrderProduct, { as: "OrderProducts", foreignKey: "orderID"});
Order.belongsTo(Store, { as: "store", foreignKey: "storeID"});
Order.belongsTo(User, { as: "user", foreignKey: "userID"});
OrderProduct.belongsTo(Order, { as: "order", foreignKey: "orderID"});
OrderProduct.belongsTo(ProductVariation, { as: "variation", foreignKey: "variationID"});
ProductVariation.belongsTo(Product, { as: "product", foreignKey: "productID"});
ProductVariation.hasMany(OrderProduct, { as: "OrderProducts", foreignKey: "variationID"});
ProductAnulation.belongsTo(ProductVariation, { as: "product", foreignKey: "productID"});
ProductVariation.hasMany(ProductAnulation, { as: "ProductAnulations", foreignKey: "productID"});
ProductAnulation.belongsTo(ProductVariation, { as: "variation", foreignKey: "variationID"});
ProductVariation.hasMany(ProductAnulation, { as: "variation_ProductAnulations", foreignKey: "variationID"});
ProductVariation.hasMany(StoreProduct, { as: "StoreProducts", foreignKey: "variationID"});
ProductAnulation.belongsTo(Returns, { as: "return", foreignKey: "returnID"});
Returns.hasMany(ProductAnulation, { as: "ProductAnulations", foreignKey: "returnID"});
Returns.belongsTo(Sale, { as: "sale", foreignKey: "saleID"});
Sale.hasMany(Returns, { as: "Returns", foreignKey: "saleID"});
Sale.hasMany(SaleProduct, { as: "SaleProducts", foreignKey: "saleID"});
Sale.belongsTo(Store, { as: "store", foreignKey: "storeID"});
SaleProduct.belongsTo(Sale, { as: "sale", foreignKey: "saleID"});
SaleProduct.belongsTo(StoreProduct, { as: "storeProduct", foreignKey: "storeProductID"});
Store.hasMany(File, { as: "Files", foreignKey: "storeID"});
Store.hasMany(Order, { as: "Orders", foreignKey: "storeID"});
Store.hasMany(Sale, { as: "Sales", foreignKey: "storeID"});
Store.hasMany(UserStore, { as: "UserStores", foreignKey: "storeID"});
Store.hasMany(StoreProduct, { as: "StoreProducts", foreignKey: "storeID"});
StoreProduct.belongsTo(Store, { as: "store", foreignKey: "storeID"});
StoreProduct.belongsTo(ProductVariation, { as: "variation", foreignKey: "variationID"});
StoreProduct.hasMany(SaleProduct, { as: "SaleProducts", foreignKey: "storeProductID"});
Returns.belongsTo(User, { as: "processedBy_User", foreignKey: "processedBy"});
User.hasMany(Order, { as: "Orders", foreignKey: "userID"});
User.hasMany(Returns, { as: "Returns", foreignKey: "processedBy"});
User.hasMany(UserStore, { as: "UserStores", foreignKey: "userID"});
UserStore.belongsTo(Store, { as: "store", foreignKey: "storeID"});
UserStore.belongsTo(User, { as: "user", foreignKey: "userID"});
```