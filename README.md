# Sports Tracking

Aplicación monolítica que consulta eventos deportivos usando TheSportsDB. Guarda la información localmente con Prisma y SQLite.

## Uso

1. Instalar dependencias:
   ```sh
   npm install
   ```
2. Configurar la base de datos y generar cliente Prisma:
   ```sh
   npx prisma migrate dev --name init
   ```
3. Ejecutar servidor:
   ```sh
   node src/index.js
   ```

La página principal permite buscar ligas por país y navegar los eventos disponibles.
