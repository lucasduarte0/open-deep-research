"use strict";
// Export NextAuth’s auth middleware for your auth handling
export { auth as middleware } from "@/app/(auth)/auth";

// Use a single matcher that applies the middleware to every request EXCEPT:
//  • /login
//  • /register
//  • any routes that start with /api
//  • And Next.js static/image/meta files can be excluded if needed (_next, favicon etc.)
//
// The regex below says: Match all routes that do NOT start with login, register or api.
// (You can extend the negative lookahead if you need to exclude _next or favicon.ico.)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
