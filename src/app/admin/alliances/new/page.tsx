import Link from "next/link";
import { H1, Section, PromptLine, Divider } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/session";
import { AllianceCreateForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewAlliancePage() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return (
      <Section title="ACCESS DENIED">
        <PromptLine>! 当前会话不是管理员账户</PromptLine>
        <PromptLine>
          &gt; <Link href="/admin" className="underline">[ &gt; BACK TO LOGIN ]</Link>
        </PromptLine>
      </Section>
    );
  }

  return (
    <div className="space-y-6">
      <H1>NEW ALLIANCE</H1>

      <Section title="CREATE ALLIANCE">
        <AllianceCreateForm />
      </Section>

      <Divider />

      <div className="flex gap-2">
        <LinkButton variant="secondary" href="/admin/alliances">
          [ &gt; BACK TO LIST ]
        </LinkButton>
      </div>
    </div>
  );
}
