// Admin 删除 Agent 按钮 — 复用 Dashboard 的 DeleteAcctButton 组件。
// 区别仅在 endpoint(T4) + 跳转目标(返回 Agent 列表而非首页)。
// 所有 WARNING 提示文案、确认输入流程、二次确认都来自 dashboard.deleteAcct* 字典。
import { DeleteAcctButton } from "@/app/dashboard/DeleteAcctButton";

interface Props {
  email: string;
  isLastAdmin: boolean;
  hasEvents: boolean;
}

export function AdminDeleteAgentButton({ email, isLastAdmin, hasEvents }: Props) {
  return (
    <DeleteAcctButton
      email={email}
      isLastAdmin={isLastAdmin}
      hasEvents={hasEvents}
      endpoint={`/api/admin/agents/${encodeURIComponent(email)}`}
      redirectAfter="/admin/agents"
    />
  );
}
