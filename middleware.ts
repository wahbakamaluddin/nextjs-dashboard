import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// initialize NextAuth.js with authConfig object and export auth property
export default NextAuth(authConfig).auth;
 
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher to specify that it should run on specific paths
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  runtime: 'nodejs',
};