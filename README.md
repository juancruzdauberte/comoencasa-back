# ComoEnCasa - Backend

## 📖 Descripción General

Backend robusto y escalable para la plataforma **ComoEnCasa**, diseñado para gestionar pedidos y finanzas de una tienda de comidas. Este sistema provee una API RESTful segura y eficiente, construida con tecnologías modernas para asegurar alto rendimiento, seguridad y mantenibilidad.

## 🚀 Tecnologías Principales

El proyecto está construido sobre un stack tecnológico sólido basado en **Node.js** y **TypeScript**.

### Core

- **Runtime:** Node.js
- **Framework:** Express.js (v5.x)
- **Lenguaje:** TypeScript

### Base de Datos y Almacenamiento

- **Base de Datos:** MySQL (driver `mysql2`)
- **Caché y Mensajería:** Redis

### Seguridad y Autenticación

- **Autenticación:** Passport.js (Estrategias Google OAuth 2.0 y JWT)
- **Seguridad HTTP:** Helmet, CORS
- **Validación y Rate Limiting:** Express Validator, Express Rate Limit

### Documentación y Utilidades

- **Documentación de API:** Swagger (OpenAPI 3.0)
- **Logging:** Winston
- **Entorno:** Dotenv

## 📂 Estructura del Proyecto

El código fuente se organiza bajo `src/` siguiendo una arquitectura modular y de separación de responsabilidades:

- `config/`: Configuraciones globales y de entorno.
- `controllers/`: Manejadores de peticiones HTTP.
- `core/`: Lógica de negocio principal y dominios.
- `db/`: Configuración y conexión a bases de datos.
- `docs/`: Definiciones de documentación API (Swagger).
- `dtos/`: Data Transfer Objects para tipado y validación de datos.
- `errors/`: Clases y manejadores de errores personalizados.
- `interfaces/`: Definiciones de tipos TypeScript y contratos.
- `middlewares/`: Interceptores de peticiones (Auth, Logging, Validación).
- `repositories/`: Capa de acceso a datos (DAL).
- `routes/`: Definición de endpoints y enrutamiento.
- `services/`: Lógica de aplicación y orquestación de servicios.
- `utils/`: Herramientas y funciones de utilidad compartidas.
