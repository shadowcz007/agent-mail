// /api/admin/alliances/[slug] — Tier 4 Admin
// PATCH 修改 / DELETE 移除(API §4.2.2-4.2.3)
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { AlliancePatchSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const PATCH = withAuth<{ slug: string }>("T4", async (req: NextRequest, { params }) => {
  const slug = decodeURIComponent(params.slug);
  const existing = await prisma.alliance.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return apiError("ALLIANCE_NOT_FOUND");

  const body = await req.json().catch(() => ({}));
  const parsed = AlliancePatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }

  const data: { name?: string; bio?: string; url?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
  if (parsed.data.url !== undefined) data.url = parsed.data.url;

  const alliance = await prisma.alliance.update({
    where: { slug },
    data,
    select: {
      slug: true,
      name: true,
      bio: true,
      url: true,
      _count: { select: { agents: true } },
    },
  });

  return NextResponse.json({
    slug: alliance.slug,
    name: alliance.name,
    bio: alliance.bio,
    url: alliance.url,
    agentCount: alliance._count.agents,
  });
});

export const DELETE = withAuth<{ slug: string }>("T4", async (_req, { params }) => {
  const slug = decodeURIComponent(params.slug);
  const existing = await prisma.alliance.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return apiError("ALLIANCE_NOT_FOUND");

  await prisma.alliance.delete({ where: { slug } });
  return new NextResponse(null, { status: 204 });
});
