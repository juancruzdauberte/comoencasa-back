import { createClient } from "redis";
import app from "./server";
import config from "./config";

const MAX_RECONNECT_ATTEMPTS = 5;

// Flag de disponibilidad — todos los safe* lo consultan antes de tocar Redis
let isRedisReady = false;

export const redisClient = createClient({
  url: config.REDIS_URL,
  socket: {
    // Backoff exponencial: 500ms, 1000ms, 1500ms … hasta 5s entre intentos
    reconnectStrategy: (retries: number) => {
      if (retries >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(
          `[Redis] Máximo de reconexiones alcanzado (${MAX_RECONNECT_ATTEMPTS}). Redis deshabilitado — la app sigue sin caché.`,
        );
        isRedisReady = false;
        return false; // detiene los reintentos
      }
      const delay = Math.min(retries * 500, 5000);
      console.warn(`[Redis] Reintentando conexión #${retries + 1} en ${delay}ms…`);
      return delay;
    },
  },
});

export const startRedisServer = async () => {
  // trust proxy NO depende de Redis — siempre se activa
  app.set("trust proxy", 1);

  let errorLogged = false;

  redisClient.on("error", (err: Error) => {
    isRedisReady = false;
    // Logueamos el primer error completo, los siguientes solo un resumen
    if (!errorLogged) {
      console.error("[Redis] Error de conexión:", err.message);
      errorLogged = true;
    }
  });

  redisClient.on("ready", () => {
    isRedisReady = true;
    errorLogged = false;
    console.log(
      `[Redis] ✅ Conectado en ${config.REDIS_HOST}:${config.REDIS_PORT}`,
    );
  });

  redisClient.on("reconnecting", () => {
    isRedisReady = false;
  });

  try {
    await redisClient.connect();
    console.log(`[Redis] Modo: ${config.NODE_ENV}`);
  } catch (err: any) {
    isRedisReady = false;
    const sanitizedUrl = config.REDIS_URL?.replace(/:\/\/[^@]+@/, "://***:***@") ?? "URL no configurada";
    console.error(
      `[Redis] ❌ No disponible (${sanitizedUrl}). La app continúa sin caché.`,
    );
  }
};

// ─── Helpers resilientes ────────────────────────────────────────────────────
// Cada uno verifica isRedisReady antes de intentar la operación.
// Si Redis no está disponible, retornan el valor neutro sin logear.

export const safeGet = async (key: string): Promise<string | null> => {
  if (!isRedisReady) return null;
  try {
    return await redisClient.get(key);
  } catch (error: any) {
    isRedisReady = false;
    console.warn(`[Redis] safeGet error — key: ${key} — ${error.message}`);
    return null;
  }
};

export const safeSet = async (
  key: string,
  value: string,
  options?: any,
): Promise<void> => {
  if (!isRedisReady) return;
  try {
    await redisClient.set(key, value, options);
  } catch (error: any) {
    isRedisReady = false;
    console.warn(`[Redis] safeSet error — key: ${key} — ${error.message}`);
  }
};

export const safeDel = async (key: string | string[]): Promise<void> => {
  if (!isRedisReady) return;
  try {
    await redisClient.del(key);
  } catch (error: any) {
    isRedisReady = false;
    console.warn(`[Redis] safeDel error — ${error.message}`);
  }
};

export const safePublish = async (
  channel: string,
  message: string,
): Promise<void> => {
  if (!isRedisReady) return;
  try {
    await redisClient.publish(channel, message);
  } catch (error: any) {
    isRedisReady = false;
    console.warn(`[Redis] safePublish error — channel: ${channel} — ${error.message}`);
  }
};

export const safeKeys = async (pattern: string): Promise<string[]> => {
  if (!isRedisReady) return [];
  try {
    return await redisClient.keys(pattern);
  } catch (error: any) {
    isRedisReady = false;
    console.warn(`[Redis] safeKeys error — pattern: ${pattern} — ${error.message}`);
    return [];
  }
};
