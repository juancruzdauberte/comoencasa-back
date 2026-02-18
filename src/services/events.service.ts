// src/services/events.service.ts
import { Response } from "express";
import { createClient } from "redis";
import config from "../config/config";

// Cliente Redis EXCLUSIVO para suscripción (Redis requiere cliente dedicado para esto)
const monitorClient = createClient({ url: config.REDIS_URL });

export class EventService {
  private static clients: Response[] = [];

  static async init() {
    await monitorClient.connect();
    // Suscribirse al canal de notificaciones globales
    await monitorClient.subscribe("NEW_ORDER_TOPIC", (message) => {
      console.log("🔔 EventService: Received Redis message", message);
      // Cuando Redis nos avisa (desde cualquier worker), notificamos a NUESTROS clientes
      EventService.broadcastToLocalClients(JSON.parse(message));
    });
    console.log("✅ EventService: Subscribed to NEW_ORDER_TOPIC");
  }

  // Añadir un cliente (pantalla de cocina)
  static addClient(res: Response) {
    this.clients.push(res);

    // Limpiar cliente cuando cierra la conexión
    res.on("close", () => {
      this.clients = this.clients.filter((client) => client !== res);
    });
  }

  // Notificar a los clientes conectados A ESTE worker
  private static broadcastToLocalClients(data: any) {
    console.log(
      `📡 EventService: Broadcasting to ${this.clients.length} clients`,
    );
    this.clients.forEach((res) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Forzar flush si es necesario (Node suele hacerlo auto en res.write pero por seguridad)
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    });
  }
}
