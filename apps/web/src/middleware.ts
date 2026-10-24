import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intl(request);

  // Rafraîchit la session Supabase et la propage dans les cookies de la réponse.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );
  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = /^\/(fr|de)\/dashboard/.test(path);
  if (isProtected && !data.user) {
    const locale = path.split("/")[1];
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
