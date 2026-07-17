import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const REFRESH_COOKIE = "ecole_refresh_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (path[0] === "auth" && path[1] === "session") {
    return handleSession(req);
  }

  return proxyRequest(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "DELETE");
}

async function handleSession(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const res = NextResponse.json(null, { status: 401 });
      clearRefreshCookie(res);
      return res;
    }

    const data = await response.json();

    setRefreshCookie(NextResponse.next(), data.refresh_token);

    const profileResponse = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const user = profileResponse.ok ? await profileResponse.json() : null;

    const res = NextResponse.json({
      access_token: data.access_token,
      user,
    });

    setRefreshCookie(res, data.refresh_token);

    return res;
  } catch {
    const res = NextResponse.json(null, { status: 503 });
    clearRefreshCookie(res);
    return res;
  }
}

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: string
) {
  const queryString = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}${queryString}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const xRequestedWith = req.headers.get("x-requested-with");
  if (xRequestedWith) {
    headers["X-Requested-With"] = xRequestedWith;
  }

  const body = method === "GET" || method === "DELETE" ? undefined : await req.text();

  if (body && body.length > 5_242_880) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" } },
      { status: 413 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const data = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }

    const isLogin = method === "POST" && path[0] === "auth" && path[1] === "login";
    const isLogout = method === "POST" && path[0] === "auth" && path[1] === "logout";

    if (isLogin && typeof parsed === "object" && parsed && "refresh_token" in (parsed as any)) {
      const parsedObj = parsed as Record<string, unknown>;
      const refreshToken = parsedObj.refresh_token as string;

      const { refresh_token: _, ...safeBody } = parsedObj;

      const res = NextResponse.json(safeBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });

      setRefreshCookie(res, refreshToken);
      return res;
    }

    if (isLogout) {
      const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

      if (refreshToken) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }

      const res = NextResponse.json({ message: "Logged out" }, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });

      clearRefreshCookie(res);
      return res;
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Backend unavailable" } },
      { status: 503 }
    );
  }
}
