import config from "./config/config";
import app from "./config/server";
import cluster from "cluster";
import os from "os";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.listen(config.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${config.PORT}`);
  });
}
