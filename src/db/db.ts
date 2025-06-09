import { createPool } from "../../node_modules/mysql2/index";
import config from "../config/config";

export const db = createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: parseInt(config.DB_PORT!),
  timezone: "-03:00",
}).promise();
