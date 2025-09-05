import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// getUser() to queries user from database
async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
        return user[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // list different login options like googel, github
  providers: [
    Credentials({
        // authorize() to handle authentication logic, zod to validate email and password
        async authorize(credentials) {
            const parsedCredentials = z
                .object({ email: z.string().email(), password: z.string().min(6) })
                .safeParse(credentials);
        
        // email and password valid, proceed to fetch user form database
        if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;
            // compare password with bcrypt.compare()
            const passwordMatch = await bcrypt.compare(password, user.password)
            
            // if password match, return user
            if (passwordMatch) return user;
        }
        
        console.log('Invalid credentials')
        return null;
        },
    }),
  ],
});