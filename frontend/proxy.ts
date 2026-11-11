import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/server/db";
import { createServerAuth, getCatalogMembership, verifyUser } from "@/src/server/services/auth";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const auth = createServerAuth({
    getAll: () => request.cookies.getAll(),
    setAll: (changes) => {
      for (const { name, value } of changes) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of changes) response.cookies.set(name, value, options);
    },
  });
  const user = await verifyUser(auth);
  if (!user || !await getCatalogMembership(db, user)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/catalogo/:path*"] };
