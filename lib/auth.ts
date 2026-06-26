import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export type UserRole = 'USER' | 'ADMIN'

// Support apps that define AUTH_URL but not NEXTAUTH_URL.
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth environment variables are missing: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
}
if (!process.env.NEXTAUTH_URL) {
  throw new Error('Missing NEXTAUTH_URL environment variable for NextAuth callback URL generation')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  logger: {
    error(error) {
      console.error('[next-auth:error]', error)
    },
    warn(code) {
      console.warn('[next-auth:warn]', code)
    },
    debug(code, metadata) {
      console.debug('[next-auth:debug]', code, metadata)
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // KRITIS: Izinkan linking akun Google ke akun email yang sudah ada
      // Tanpa ini, user yang daftar via email tidak bisa login Google
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
          },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials: authorize() sudah handle validasi
      if (!account || account.provider === 'credentials') {
        return true
      }

      // Google OAuth
      if (account.provider === 'google') {
        // Email wajib ada
        if (!user.email) return false

        // Cek apakah user dengan email ini sudah terdaftar
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (existingUser) {
          // Sudah ada akun — cek apakah Google account sudah di-link
          const googleLinked = existingUser.accounts.some(
            (a) => a.provider === 'google'
          )

          if (!googleLinked) {
            // Belum ada Google account → link sekarang
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })

            // Update gambar profil dari Google jika user belum punya
            const googlePicture = (profile as { picture?: string } | undefined)?.picture
            if (!existingUser.image && googlePicture) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: googlePicture },
              })
            }
          }
        }
        // Jika user belum ada, PrismaAdapter akan buat user baru otomatis
        return true
      }

      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // Saat pertama kali login (user object ada)
      if (user) {
        token.id = user.id as string
        token.role = ((user as { role?: UserRole }).role ?? 'USER') as UserRole
      }

      // Saat login Google: pastikan token.id ter-set dari DB
      // (karena allowDangerousEmailAccountLinking, user yang existing
      //  mungkin punya id yang berbeda dari yang di token)
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, name: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role as UserRole
          if (dbUser.name) token.name = dbUser.name
        }
      }

      // Update session manual (misal setelah ubah nama/role)
      if (trigger === 'update' && session) {
        if (session.user?.name) token.name = session.user.name
        if (session.user?.role) token.role = session.user.role
      }

      // Refresh role & nama dari DB di setiap request
      // (supaya perubahan role admin langsung efektif, dan nama sync)
      if (token.id && !user && !account) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true },
        })
        if (dbUser) {
          token.role = dbUser.role as UserRole
          if (dbUser.name) token.name = dbUser.name
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as UserRole) ?? 'USER'
        if (token.name) session.user.name = token.name as string
      }
      return session
    },
  },

  events: {
    // Saat user BARU dibuat via Google OAuth, set role default USER
    // (tidak dipanggil saat link akun existing)
    async createUser({ user }) {
      if (!user.id) return
      // Pastikan role ter-set — kolom role punya default USER tapi
      // explicit set untuk keamanan
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'USER' },
      }).catch(() => {
        // Ignore jika user sudah punya role
      })
    },
  },
})
