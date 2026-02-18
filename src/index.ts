import config from "./config/config";
import { secureLogger } from "./config/logger";
import { startRedisServer } from "./config/redis.config";
import app from "./config/server";
import cluster from "cluster";
import os from "os";
import { EventService } from "./services/events.service";

const numCPUs = os.cpus().length;

// ✅ SOLUCIÓN 1: Limitar procesos según el entorno
const getWorkerCount = (): number => {
  if (config.NODE_ENV === "production") {
    // En producción: usar máximo 4 workers (o la mitad de CPUs disponibles)
    return Math.min(4, Math.ceil(numCPUs / 2));
  } else {
    // En desarrollo: solo 1 worker para reducir consumo
    return 1;
  }
};

const WORKER_COUNT = getWorkerCount();

if (cluster.isPrimary) {
  secureLogger.info(`Master process ${process.pid} is running`);
  secureLogger.info(
    `Spawning ${WORKER_COUNT} workers (${numCPUs} CPUs available)`,
  );

  // ✅ SOLUCIÓN 2: Crear workers con límites de memoria
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = cluster.fork();

    // Monitorear memoria de cada worker
    worker.on("message", (msg) => {
      if (msg.type === "memory") {
        const memoryMB = Math.round(msg.usage / 1024 / 1024);
        if (memoryMB > 500) {
          // Alerta si supera 500MB
          secureLogger.warn(`Worker ${worker.id} using ${memoryMB}MB RAM`);
        }
      }
    });
  }

  // ✅ SOLUCIÓN 3: Reiniciar workers si mueren
  cluster.on("exit", (worker, code, signal) => {
    secureLogger.error(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  // ✅ SOLUCIÓN 4: Reportar memoria cada 30 segundos
  setInterval(() => {
    const used = process.memoryUsage();
    secureLogger.info("Master Memory Usage:", {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    });
  }, 30000);
} else {
  // Worker process
  app.listen(config.PORT, async () => {
    secureLogger.info(`Worker ${process.pid} started on port ${config.PORT}`);
    await startRedisServer();
    await EventService.init();
  });

  // ✅ SOLUCIÓN 5: Reportar memoria del worker
  setInterval(() => {
    const used = process.memoryUsage();
    process.send?.({
      type: "memory",
      usage: used.rss,
      workerId: cluster.worker?.id,
    });
  }, 30000);

  // ✅ SOLUCIÓN 6: Graceful shutdown
  process.on("SIGTERM", () => {
    secureLogger.info(`Worker ${process.pid} shutting down gracefully`);
    process.exit(0);
  });
}
