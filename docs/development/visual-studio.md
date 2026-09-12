# Ejecutar AccessiUX Market API desde Visual Studio

El proyecto `AccessiUXMarket.Api` está preparado para ejecutarse directamente con **F5 / Iniciar depuración** en Visual Studio usando el perfil `AccessiUXMarket.Api`.

## Requisitos locales

1. SQL Server debe estar disponible.
2. Si se usa el `docker-compose.yml` del repositorio, el contenedor es `accessiuxmarket-sqlserver`.
3. Los secretos de desarrollo no se guardan en Git; se cargan mediante **ASP.NET Core User Secrets**.

## Configurar secretos desde Visual Studio

En el Explorador de soluciones:

1. Clic derecho sobre `AccessiUXMarket.Api`.
2. Seleccionar **Administrar secretos de usuario**.
3. Guardar una configuración como esta, reemplazando `TU_PASSWORD_SQL` por el mismo valor de `MSSQL_SA_PASSWORD` usado por tu SQL Server local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,14330;Database=AccessiUXMarketDev;User Id=sa;Password=TU_PASSWORD_SQL;TrustServerCertificate=True;Encrypt=True"
  },
  "Jwt": {
    "SigningKey": "AccessiUXMarket_Local_Development_SigningKey_2026_AtLeast32Bytes"
  }
}
```

> Si tu SQL Server publica el puerto estándar `1433`, cambia `localhost,14330` por `localhost,1433`.

## Ejecutar

1. Establecer `AccessiUXMarket.Api` como proyecto de inicio.
2. Seleccionar el perfil `AccessiUXMarket.Api`.
3. Presionar **F5** o **Ctrl+F5**.

La API usa:

- HTTPS: `https://localhost:7193`
- HTTP: `http://localhost:5193`
- Endpoint de comprobación: `https://localhost:7193/api`
- Health readiness: `https://localhost:7193/health/ready`

En `Development` se aplican las migraciones pendientes y se cargan roles, catálogo y usuarios demo automáticamente.

El frontend Angular ya apunta a `https://localhost:7193` mediante `proxy.conf.json`, por lo que puede ejecutarse en otra terminal con `npm start` mientras el backend permanece iniciado desde Visual Studio.
