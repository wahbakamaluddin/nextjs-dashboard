import next from 'next';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// export configuration options for NextAuth.js
export const authConfig = {
    // specify custom route for sign-in, sign-out, error pages
    pages: {
        signIn: '/login',
    },
    // logics to protect routes unless user is logged in
    callbacks: {
        // authorized callback is called before a request is completed
        // auth contains user's session, request contains incoming request
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    // specify login options like google, github, etc
    providers: [],
} satisfies NextAuthConfig;