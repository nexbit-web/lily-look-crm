import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "INTERN";

type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
};

const ROLE_ROUTES: Record<string, Role[]> = {
  "/dashboard/accounting": ["OWNER", "ADMIN"],
  "/dashboard/employees": ["OWNER", "ADMIN"],
  "/dashboard/orders": ["OWNER", "ADMIN", "MANAGER"],
  "/dashboard/products": ["OWNER", "ADMIN", "MANAGER"],
  "/dashboard": ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "INTERN"],
};

export async function middleware(req: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: req.nextUrl.origin,
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
    },
  );

  const path = req.nextUrl.pathname;

  // Нет сессии — на логин
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  // Сортируем от длинного к короткому чтобы /dashboard/orders проверялся раньше /dashboard
  const sortedRoutes = Object.entries(ROLE_ROUTES).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [route, allowedRoles] of sortedRoutes) {
    if (path.startsWith(route)) {
      if (!allowedRoles.includes(role)) {
        const forbiddenUrl = new URL("/forbidden", req.url);
        forbiddenUrl.searchParams.set("from", path);
        return NextResponse.redirect(forbiddenUrl);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
