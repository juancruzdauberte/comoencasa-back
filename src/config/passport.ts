import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config";
import { generateAccessToken, generateRefreshToken } from "../utils/utils";
import UserService from "../services/user.service";

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
          const authenticateEmail = profile.emails?.[0].value;
          const avatar = profile.photos?.[0]?.value ?? "";

          if (!authenticateEmail) return done(null, false);
          const user = await UserService.getUser(authenticateEmail);
          if (!user) {
            return done(null, false);
          }

          const { rol, email } = user;

          const accessToken = generateAccessToken({ rol, email, avatar });
          const refreshToken = generateRefreshToken({ rol, email, avatar });

          return done(null, { user, accessToken, refreshToken });
        } catch (error) {
          return done(null, false);
        }
      }
    )
  );
}
