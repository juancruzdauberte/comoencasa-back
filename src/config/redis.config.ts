import { createClient } from "redis";
import app from "./server";
import config from "./config";

export const redisClient = createClient({
  url: config.REDIS_URL,
});

export const startRedisServer = async () => {
  try {
    await redisClient.connect();
    console.log("Modo", config.NODE_ENV);
    console.log(
      `Conectado a Redis exitosamente ${config.REDIS_HOST}:${config.REDIS_PORT}`
    );

    app.set("trust proxy", 1);
  } catch (err) {
    console.error("No se pudo conectar a Redis. Saliendo...", err);
    process.exit(1);
  }
};
