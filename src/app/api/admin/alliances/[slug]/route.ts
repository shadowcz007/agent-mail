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

  const { isPrimary, ...rest } = parsed.data;

  const data: { name?: string; bio?: string; url?: string | null; isPrimary?: boolean } = { ...rest };
  if (isPrimary !== undefined) data.isPrimary = isPrimary;

  // isPrimary=true 时:事务内全表置 false → 设当前 true,保证全局唯一
  const alliance = await prisma.$transaction(async (tx) => {
    if (isPrimary === true) {
      await tx.alliance.updateMany({ data: { isPrimary: false } });
    }
    return tx.alliance.update({
      where: { slug },
      data,
      select: {
        slug: true,
        name: true,
        bio: true,
        url: true,
        isPrimary: true,
        _count: { select: { agents: true } },
      },
    });
  });

  return NextResponse.json({
    slug: alliance.slug,
    name: alliance.name,
    bio: alliance.bio,
    url: alliance.url,
    isPrimary: alliance.isPrimary,
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
