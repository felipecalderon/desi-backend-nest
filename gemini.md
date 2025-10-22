# Contexto del Proyecto: Migración de Sistema Heredado a NestJS

## 1. Objetivo Principal

Este proyecto consiste en la reescritura y modernización de una aplicación heredada de Node.js y Sequelize. La nueva implementación utilizará **NestJS** y **TypeORM**, aplicando principios de **Domain-Driven Design (DDD)** para lograr una arquitectura modular, escalable y mantenible.

El objetivo es migrar la lógica de negocio y la estructura de la base de datos existentes, eliminando redundancias y mejorando la calidad general del código.

## 2. Principios Arquitectónicos Fundamentales

El desarrollo debe adherirse estrictamente a los siguientes principios:

- **Diseño Orientado al Dominio (DDD)**:
    - Cada módulo de NestJS (`@Module()`) debe representar un **Contexto Delimitado (Bounded Context)**.
    - Las entidades de dominio se definirán dentro de su módulo correspondiente. Solo los servicios deben ser exportados para mantener la encapsulación.
    - Las asociaciones entre dominios deben ser **unidireccionales** y estar explícitamente controladas.

- **Desacoplamiento entre Dominio y Persistencia**:
    - El modelo de dominio debe consistir en clases simples (POJOs/POCOs), desacopladas de la capa de persistencia.
    - La capa de infraestructura (usando TypeORM) será la única responsable de mapear estas entidades de dominio al esquema de la base de datos.

- **Uso de DTOs (Data Transfer Objects)**:
    - **Nunca exponer las entidades del ORM** directamente a través de la API.
    - Utilizar DTOs para toda la comunicación entre capas (controladores, servicios) y para las cargas útiles de la API.
    - Aplicar `class-validator` y `class-transformer` en los DTOs para la validación y transformación de datos.

- **Estrategia de Acceso a Datos**:
    - Utilizar los repositorios de TypeORM para operaciones que involucren lógica de negocio compleja.
    - Para consultas simples, reportes o `joins` complejos, preferir el uso de `QueryBuilder` o SQL directo para evitar la sobrecarga del ORM.

## 3. Tarea Principal: Implementación de Dominios

La tarea principal es **diseñar e implementar los dominios principales** de la aplicación. Esto incluye la creación de módulos, entidades de TypeORM, DTOs, servicios y controladores, basándose en las relaciones y la estructura del sistema heredado.

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