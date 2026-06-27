// Server-side helper: 读取当前 session 对应的 Agent 简要信息(用于 TopBar)
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const agent = await prisma.agent.findUnique({
    where: { email: payload.sub },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  if (!agent) return null;
  return agent;
}
