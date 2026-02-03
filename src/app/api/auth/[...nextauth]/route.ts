import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const sql = connectionString ? (neon(connectionString) as any) : null;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kayser.abbas@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Mirqal19*";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // Admin login via env password
        if (
          credentials.email === ADMIN_EMAIL &&
          credentials.password === ADMIN_PASSWORD
        ) {
          return {
            id: "admin",
            name: "Admin",
            email: ADMIN_EMAIL,
            role: "admin",
          } as any;
        }

        if (!sql) return null;

        try {
          // Lookup user in DB
          const rows = await sql`
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = ${credentials.email}
            LIMIT 1
          `;

          const user = rows[0];
          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );
          if (!isValid) return null;

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role || "user",
          } as any;
        } catch (error) {
          console.error('Database error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Initial sign in
        let role = (user as any).role || "user";

        // Admin via env email
        if (user.email === ADMIN_EMAIL) {
          role = "admin";
        }

        // Ensure user exists in DB for Google login
        if (sql && user.email) {
          try {
            const existing = await sql`
              SELECT id, role FROM users WHERE email = ${user.email}
            `;
            if (existing[0]) {
              role = existing[0].role || role;
            } else {
              const inserted = await sql`
                INSERT INTO users (name, email, role)
                VALUES (${user.name || user.email}, ${user.email}, ${role})
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, role
              `;
              role = inserted[0].role || role;
            }
          } catch (error) {
            console.error('Database error in jwt callback:', error);
            // Fallback to default role
          }
        }

        token.role = role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).role = (token as any).role || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

