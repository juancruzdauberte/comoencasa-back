import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config";
import { Payload, UserRole } from "../types/types";
import { generateAccessToken } from "../utils/utils";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIEND_ID!,
        clientSecret: config.GOOGLE_CLIENT_SECRET!,
        callbackURL: config.GOOGLE_CALLBACK_URL!,
      },
      async (_accesToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(null, false, {
              message: "No se pudo obtener el correo",
            });
          }
          let role: UserRole = "none";

          if (config.ADMIN_EMAIL === email) {
            role = "admin";
          } else if (config.CLIENT_EMAIL === email) {
            role = "client";
          }

          if (role === "none") {
            return done(null, false, { message: "Correo no autorizado" });
          }

          const payload: Payload = {
            email,
            role,
          };

          const accessToken = generateAccessToken(payload);

          return done(null, { accessToken, user: payload });
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}
