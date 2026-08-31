/**
 * boots an in-process mongodb-memory-server, prints the connection
 * URI to stdout, and keeps the process alive until SIGINT/SIGTERM.
 *
 * Usage:
 *   node scripts/bootMongoMemory.mjs            # default db name "zyra"
 *   MONGOMS_VERSION=5.0.14 node scripts/bootMongoMemory.mjs
 *   MONGOMS_DBNAME=mydb node scripts/bootMongoMemory.mjs
 *   MONGOMS_PORT=27017 node scripts/bootMongoMemory.mjs
 */
import { MongoMemoryServer } from "mongodb-memory-server";

// 5.0.x is ~200MB (vs 8.2 at 781MB) and stable on Windows.
const version = process.env.MONGOMS_VERSION || "5.0.14";
const dbName = process.env.MONGOMS_DBNAME || "zyra";
const desiredPort = Number(process.env.MONGOMS_PORT || 27017);

(async () => {
  console.log(`Starting in-memory MongoDB ${version} on port ${desiredPort}, db "${dbName}"...`);
  const server = await MongoMemoryServer.create({
    binary: { version },
    instance: { dbName, port: desiredPort, ip: "127.0.0.1" },
  });

  const uri = server.getUri();
  console.log("MONGOMS_URI=" + uri);

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, stopping in-memory MongoDB...`);
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Keep process alive
  setInterval(() => {}, 1 << 30);
})().catch((err) => {
  console.error("Failed to start in-memory MongoDB:", err);
  process.exit(1);
});
