import "dotenv/config";

import sql from "mssql";

/**
 * Crea la base de datos indicada en DATABASE_URL si aún no existe.
 * SQL Server no crea bases de datos desde la cadena de conexión, así que este
 * script se ejecuta una sola vez antes de la primera migración: `npm run db:create`.
 */
function parseDatabaseUrl(url: string) {
  const withoutProtocol = url.replace(/^sqlserver:\/\//, "");
  const [hostPart, ...params] = withoutProtocol.split(";");
  const [host = "localhost", port = "1433"] = (hostPart ?? "").split(":");

  const options = new Map<string, string>();
  for (const param of params) {
    const [key, ...rest] = param.split("=");
    if (key) options.set(key.trim().toLowerCase(), rest.join("=").trim());
  }

  return {
    server: host,
    port: Number(port),
    database: options.get("database") ?? "stockpilot",
    user: options.get("user") ?? "sa",
    password: options.get("password") ?? "",
    encrypt: options.get("encrypt") !== "false",
    trustServerCertificate: options.get("trustservercertificate") === "true",
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida. Copia .env.example como .env.");

  const config = parseDatabaseUrl(url);
  if (!/^[A-Za-z0-9_]+$/.test(config.database)) {
    throw new Error(`Nombre de base de datos inválido: ${config.database}`);
  }

  const pool = await sql.connect({
    server: config.server,
    port: config.port,
    user: config.user,
    password: config.password,
    database: "master",
    options: { encrypt: config.encrypt, trustServerCertificate: config.trustServerCertificate },
  });

  try {
    const exists = await pool
      .request()
      .input("name", sql.NVarChar, config.database)
      .query("SELECT DB_ID(@name) AS id");

    if (exists.recordset[0]?.id != null) {
      console.log(`La base de datos "${config.database}" ya existe.`);
      return;
    }

    await pool.request().query(`CREATE DATABASE [${config.database}]`);
    console.log(`Base de datos "${config.database}" creada en ${config.server}:${config.port}.`);
  } finally {
    await pool.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    "No se pudo crear la base de datos:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
