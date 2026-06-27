// POST /api/auth/logout - T3 Session,清除 Session Cookie
// SPEC §3.1.1 / API §3.2
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { clearSessionCookie, withAuth } from "@/lib/auth";

export const POST = withAuth("T3", async (_req: NextRequest) => {
  return clearSessionCookie();
});
