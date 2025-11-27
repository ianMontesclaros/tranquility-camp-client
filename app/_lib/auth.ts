import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { getGuest, createGuest } from "./data-service";

const googleProvider = Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
});

googleProvider.type = "oauth";
googleProvider.token = "https://oauth2.googleapis.com/token";
googleProvider.userinfo = "https://openidconnect.googleapis.com/v1/userinfo";

googleProvider.authorization = {
  url: "https://accounts.google.com/o/oauth2/v2/auth",
  params: {
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  },
};

const authConfig: NextAuthConfig = {
  debug: true,

  providers: [googleProvider],

  callbacks: {
    authorized({ request, auth }) {
      if (request.nextUrl.pathname.startsWith("/api/auth")) {
        return true;
      }

      return !!auth?.user;
    },

    async signIn({ user }) {
      try {
        if (!user?.email) return true;

        const existing = await getGuest(user.email);

        if (!existing) {
          await createGuest({
            email: user.email,
            fullName: user.name ?? "",
          });
        }

        return true;
      } catch (err) {
        console.error("signIn callback error:", err);
        return true;
      }
    },

    async session({ session }) {
      try {
        const email = session.user?.email;
        if (!email) return session;

        const guest = await getGuest(email);

        if (guest?.id) {
          session.user.guestId = guest.id;
        }

        return session;
      } catch (err) {
        console.error("session callback error:", err);
        return session;
      }
    },
  },

  pages: {
    signIn: "/login",
  },
};

export const {
  auth,
  handlers: { GET, POST },
  signIn,
  signOut,
} = NextAuth(authConfig);
