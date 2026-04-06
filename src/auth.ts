import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const githubClientId =
  process.env.AUTH_GITHUB_ID ??
  process.env.GITHUB_ID ??
  process.env.GITHUB_CLIENT_ID;

const githubClientSecret =
  process.env.AUTH_GITHUB_SECRET ??
  process.env.GITHUB_SECRET ??
  process.env.GITHUB_CLIENT_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers:
    githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : [],
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
