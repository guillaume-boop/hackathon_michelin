import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            email: user.email,
            username: user.name ?? user.email?.split('@')[0],
            avatar_url: user.image ?? null,
            role: 'user',
            circle_score: 0,
          },
          { onConflict: 'email' }
        )

      if (error) {
        console.error('Supabase upsert error:', error.message)
        return false
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
  },
  session: { strategy: 'jwt' },
}
