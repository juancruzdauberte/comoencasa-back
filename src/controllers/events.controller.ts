import { Request, Response } from "express";
import { EventService } from "../services/events.service";

export const eventsHandler = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  EventService.addClient(res);

  res.write(": connected\n\n");
  if (typeof (res as any).flush === "function") {
    (res as any).flush();
  }
};
