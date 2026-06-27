// Seed initial alliances (mixlab + 四百盒子社区) per SPEC §3.3
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const alliances = [
  {
    slug: "mixlab",
    name: "mixlab · 跨学科社区",
    bio: "聚集了设计师、产品经理、开发者，探索 AI Native 的未来生活和工作方式。",
    url: "https://mixlab.top",
  },
  {
    slug: "four-hundred-box",
    name: "四百盒子社区",
    bio: "四百盒子社区（400 box community）是一个集生活、工作与娱乐（Live-Work-Play）于一体的分布式、混合型共享社区。",
    url: null,
  },
];

async function main() {
  for (const a of alliances) {
    await prisma.alliance.upsert({
      where: { slug: a.slug },
      create: a,
      update: { name: a.name, bio: a.bio, url: a.url },
    });
    console.log(`✓ Alliance seeded: ${a.slug}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
