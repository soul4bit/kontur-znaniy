import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { Pool } from "pg";
import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/mail/server";
import { getAuthEnv } from "./env";

declare global {
  var nookPgPool: Pool | undefined;
}

const { databaseUrl, secret, baseUrl } = getAuthEnv();

export const pool =
  globalThis.nookPgPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.nookPgPool = pool;
}

export const auth = betterAuth({
  database: pool,
  secret,
  baseURL: baseUrl,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendResetPasswordEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  plugins: [admin(), nextCookies()],
});
