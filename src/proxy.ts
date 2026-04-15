import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/pricing"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes and auth API
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/api/auth")
  ) {
    return;
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|pricing\\.md|site\\.webmanifest|.*\\.json|.*\\.gif|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.woff2?).*)"],
};
