// POST /api/admin/alliances — Tier 4 Admin
// 新增联盟(API §4.2.1)
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { AllianceCreateSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const POST = withAuth("T4", async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = AllianceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", { details: parsed.error.flatten() });
  }
  const { slug, name, bio, url } = parsed.data;

  const existing = await prisma.alliance.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return apiError("VALIDATION_ERROR", { status: 409, message: "slug 已存在" });
  }

  const alliance = await prisma.alliance.create({
    data: { slug, name, bio, url: url ?? null },
    select: {
      slug: true,
      name: true,
      bio: true,
      url: true,
      createdAt: true,
      _count: { select: { agents: true } },
    },
  });

  return NextResponse.json(
    {
      slug: alliance.slug,
      name: alliance.name,
      bio: alliance.bio,
      url: alliance.url,
      agentCount: alliance._count.agents,
      createdAt: alliance.createdAt.toISOString(),
    },
    { status: 201 }
  );
});
