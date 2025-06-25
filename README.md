# Backend App

Backend app construida con TypeScript, Express, Prisma, y Supabase. Proporciona una API RESTful para la gestión de autenticación, productos, pedidos, y roles de usuario, con énfasis en robustez, escalabilidad, y calidad del código.

## Características

- **Autenticación**: Registro (`POST /api/auth/register`) e inicio de sesión (`POST /api/auth/login`) con Supabase Auth y JWT.
- **Gestión de recursos**: CRUD para productos (`/api/products`), pedidos (`/api/orders`), y roles de usuario (`/api/users/:id/role`).
- **Manejo de errores estandarizado**: Respuestas de error en formato `{ error: { code, message, details } }`.
- **Rate limiting**: Límite de 100 solicitudes por minuto por IP para proteger la API.
- **Reintentos**: Lógica de reintentos con backoff exponencial para operaciones de Supabase y Prisma.
- **Documentación**: API documentada con Swagger, accesible en `/api-docs`.
- **Calidad del código**: ESLint y Prettier para mantener un código limpio y consistente.
- **Base de datos**: Prisma ORM con PostgreSQL (Supabase).

## Requisitos previos

- **Node.js**: Versión 18.x o 20.x.
- **Yarn Berry**: Versión 3.x o superior.
- **Supabase**: Cuenta con proyecto configurado y claves de acceso (`SUPABASE_URL`, `SUPABASE_KEY`).
- **PostgreSQL**: Base de datos configurada (puede ser gestionada por Supabase).

## Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/dardac/avilatek-backend/
   cd avilatek-backend
   ```

2. **Instalar dependencias**:
   ```bash
   yarn
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto con el contenido en `.env.example`

4. **Configurar la base de datos**:
   - Asegúrate de que la base de datos PostgreSQL esté accesible.
   - Genera el cliente de Prisma:
     ```bash
     yarn prisma:generate
     ```
   - Aplica las migraciones:
     ```bash
     yarn prisma:migrate
     ```

5. **Formatear y lintar el código**:
   ```bash
   yarn format
   yarn lint:fix
   ```

## Ejecución

1. **Modo desarrollo**:
   ```bash
   yarn dev
   ```
   Esto inicia el servidor con `nodemon` en `http://localhost:3000`.

2. **Construir para producción**:
   ```bash
   yarn build
   yarn start
   ```

3. **Acceder a la documentación**:
   Abre `http://localhost:3000/api-docs` en tu navegador para explorar la API con Swagger.

## Scripts disponibles

- `yarn dev`: Inicia el servidor en modo desarrollo con recarga automática.
- `yarn build`: Compila el código TypeScript a JavaScript (`dist/`).
- `yarn start`: Inicia el servidor en modo producción.
- `yarn prisma:generate`: Genera el cliente de Prisma.
- `yarn prisma:migrate`: Aplica migraciones a la base de datos.
- `yarn prisma:reset`: Reinicia la base de datos (cuidado: elimina datos).
- `yarn lint`: Verifica el código con ESLint.
- `yarn lint:fix`: Corrige errores de ESLint y aplica formato con Prettier.
- `yarn format`: Aplica formato con Prettier.
- `yarn format:check`: Verifica el formato con Prettier.

## Decisiones de diseño

### 1. **Base de datos PostgreSQL**
   - **Razón**: Al leer que se solicitaba una aplicación escalable en lo primero que pensé fue en MongoDB. MongoDB sería una alternativa válida si los productos tuvieran atributos altamente dinámicos o si la escalabilidad horizontal fuera una prioridad inmediata; sin embargo, el proyecto enfatiza la integridad de datos, relaciones claras y escalabilidad manejable, por lo que en este caso PostgreSQL es más adecuado.

### 2. **Arquitectura modular**
   - Separar la lógica en capas (`routes`, `services`, `middleware`, `utils`) mejora la mantenibilidad y escalabilidad.

### 3. **Manejo de errores estandarizado**
   - Un formato de error consistente (`{ error: { code, message, details } }`) facilita la depuración y mejora la experiencia del cliente.

### 4. **Reintentos con backoff exponencial**
   - Las operaciones de red (Supabase, Prisma) pueden fallar temporalmente, y los reintentos mejoran la robustez.

### 5. **Rate limiting**
   - Proteger la API contra abusos y ataques de fuerza bruta.
   - **Implementación**:
     - `express-rate-limit` en `src/middleware/rate-limit.middleware.ts` limita a 100 solicitudes por minuto por IP.
     - Aplicado globalmente en `/api` en `src/index.ts`.

### 6. **Autenticación con Supabase y Prisma**
   - Supabase Auth proporciona un sistema de autenticación seguro, mientras que Prisma gestiona datos adicionales de usuario.
   - **Implementación**:
     - `supabase.auth.signUp` crea usuarios en Supabase Auth.
     - `prisma.user.create` sincroniza datos en la tabla `User` de PostgreSQL.
     - Tokens JWT devueltos por Supabase para autenticación en rutas protegidas.

### 7. **Documentación con Swagger**
   - Documentación clara y accesible para desarrolladores y clientes.
   - **Implementación**:
     - `swagger-jsdoc` y `swagger-ui-express` en `src/swagger.ts`.
     - Rutas documentadas con JSDoc en `src/routes/*.ts`.
     - Accesible en `http://localhost:3000/api-docs`.

### 8. **Uso de Yarn Berry**
   - Yarn Berry ofrece mejor gestión de dependencias y soporte para módulos ES.

## Mejoras recomendadas, adicionales a lo requerido

- **Pruebas unitarias**: Implementar Jest para pruebas automatizadas.
- **Husky**: Configurar pre-commit hooks para linting y formato.
- **Redis**: Usar Redis para rate limiting distribuido.
- **Módulos ES**: Migrar de CommonJS a ESM para mejor compatibilidad.
- **Despliegue**: Documentar despliegue en Supabase/Vercel.
- **Docker**: Dockerizar la aplicación para más facilidad al momento de correr y desplegar la app.
