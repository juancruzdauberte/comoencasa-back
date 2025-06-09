import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: process.env.PORT,
  GOOGLE_CLIEND_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  CLIENT_EMAIL: process.env.CLIENT_EMAIL,
};

export default config;
