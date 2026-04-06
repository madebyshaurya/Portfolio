import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "login" in profile && typeof profile.login === "string") {
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.username === "string") {
        (session.user as typeof session.user & { username?: string }).username =
          token.username;
      }
      return session;
    },
  },
});
