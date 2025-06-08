# AGENTS

- **api-agent**: Encargado de consultar la API de TheSportsDB.
- **db-agent**: Maneja Prisma y la persistencia local en SQLite.
- **ui-agent**: Renderiza las vistas HTML con Tailwind.

Antes de enviar un PR ejecutá `node src/index.js` para verificar que el servidor inicia (aunque la descarga de engines puede fallar en entornos sin acceso a binaries de Prisma).
