import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "desarrollo_local_antigravity_123",
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Buscar usuario en Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          // Si el usuario no existe en la tabla, permitimos el demo con rol admin para pruebas
          if (credentials.email === "demo@modacircular.com" && credentials.password === "password123") {
            return { 
              id: "00000000-0000-0000-0000-000000000000", 
              name: "Usuario Demo", 
              email: "demo@modacircular.com",
              role: "admin" 
            };
          }
          return null;
        }

        // 2. Comparar contraseña encriptada
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isPasswordCorrect) return null;

        // 3. Forzar rol de admin para el usuario principal o detectar de DB
        let finalRole = user.role;
        if (user.email === 'cmontenegro1411@gmail.com' || user.email === 'demo@modacircular.com') {
          finalRole = 'admin';
        }

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: finalRole 
        };
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hora de inactividad como máximo
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});
