import { createClient } from "redis";
import app from "./server";

export const redisClient = createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
  // Si tu Redis tiene contraseña, añádelo aquí:
  // password: 'tu_password'
});

export const startRedisServer = async () => {
  try {
    await redisClient.connect();
    console.log("Conectado a Redis exitosamente.");

    app.set("trust proxy", 1);
    // ...otros app.use...

    // AQUÍ ES DONDE REGISTRAS TUS RUTAS
    // app.use('/api/mi-ruta', miRouter);
  } catch (err) {
    console.error("No se pudo conectar a Redis. Saliendo...", err);
    process.exit(1); // Salir de la aplicación si no se puede conectar
  }
};
