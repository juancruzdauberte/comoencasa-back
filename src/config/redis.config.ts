import { createClient } from "redis";
import app from "./server";
import config from "./config";

export const redisClient = createClient({
  url: config.REDIS_URL,
});

export const startRedisServer = async () => {
  try {
    // Event listeners para debug
    redisClient.on("error", (err) => console.error("Redis Client Error", err));

    await redisClient.connect();
    console.log("Modo", config.NODE_ENV);
    console.log(
      `✅ Conectado a Redis exitosamente en ${config.REDIS_HOST}:${config.REDIS_PORT}`,
    );

    app.set("trust proxy", 1);
  } catch (err) {
    // Sanitizar URL para el log
    const sanitizedUrl = config.REDIS_URL.replace(/:\/\/[^@]+@/, "://***:***@");
    console.error(
      `❌ Error Fatal: No se pudo conectar a Redis (${sanitizedUrl})`,
    );
    console.error("Detalle del error:", err);
    // No matamos el proceso inmediatamente para permitir ver los logs en Railway
    // process.exit(1);
  }
};
