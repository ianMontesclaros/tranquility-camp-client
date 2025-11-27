import { auth } from "./app/_lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  if (nextUrl.pathname.startsWith("/api/auth")) {
    return;
  }

  if (nextUrl.pathname.startsWith("/account") && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: ["/account"],
};
