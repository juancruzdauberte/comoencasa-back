import { Command, Option } from "commander";
import dotenv from "dotenv";
import fs from "fs";

const program = new Command();

program.addOption(
  new Option("-m, --mode <MODE>", "Modo de ejecucion del servidor")
    .choices(["prod", "dev"])
    .default("dev")
);
program.allowUnknownOption();
program.allowExcessArguments();

program.parse();
const { mode } = program.opts();

const envFile = mode === "prod" ? ".env" : ".env.dev";

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

interface Config {
  PORT: string;
  GOOGLE_CLIEND_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  CLIENT_URL: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_PORT: string;
  JWT_SECRET_ACCESS_TOKEN: string;
  JWT_SECRET_REFRESH_TOKEN: string;
  NODE_ENV: string;
}

function validateConfig(): Config {
  const requiredVars = [
    "PORT",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "CLIENT_URL",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_PORT",
    "JWT_SECRET_ACCESS_TOKEN",
    "JWT_SECRET_REFRESH_TOKEN",
    "NODE_ENV",
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ FATAL ERROR: Missing required environment variables:\n${missing
        .map((v) => `  - ${v}`)
        .join("\n")}\n\nPlease check your ${envFile} file.`
    );
  }

  const jwtAccessSecret = process.env.JWT_SECRET_ACCESS_TOKEN!;
  const jwtRefreshSecret = process.env.JWT_SECRET_REFRESH_TOKEN!;

  if (jwtAccessSecret.length < 10) {
    throw new Error(
      "❌ JWT_SECRET_ACCESS_TOKEN must be at least 50 characters long for security"
    );
  }

  if (jwtRefreshSecret.length < 10) {
    throw new Error(
      "❌ JWT_SECRET_REFRESH_TOKEN must be at least 50 characters long for security"
    );
  }

  if (jwtAccessSecret === jwtRefreshSecret) {
    throw new Error(
      "❌ JWT_SECRET_ACCESS_TOKEN and JWT_SECRET_REFRESH_TOKEN must be different"
    );
  }

  const port = parseInt(process.env.PORT!);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("❌ PORT must be a valid port number (1-65535)");
  }

  const dbPort = parseInt(process.env.DB_PORT!);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error("❌ DB_PORT must be a valid port number (1-65535)");
  }

  console.log(
    `✅ Environment configuration validated successfully (${mode} mode)`
  );

  return {
    PORT: process.env.PORT!,
    GOOGLE_CLIEND_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
    CLIENT_URL: process.env.CLIENT_URL!,
    DB_HOST: process.env.DB_HOST!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
    DB_PORT: process.env.DB_PORT!,
    JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN!,
    JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN!,
    NODE_ENV: process.env.NODE_ENV!,
  };
}

const config = validateConfig();

export default config;
