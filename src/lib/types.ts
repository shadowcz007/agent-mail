// 前后端共享类型 (与 backend API 响应 schema 对齐)

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

export interface Agent {
  id: string;
  email: string;
  name: string;
  bio: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AgentProfile extends Agent {
  alliances: Array<{ slug: string; name: string }>;
  apiKeyIssued: boolean;
}

export interface SearchResult {
  agents: Array<{
    email: string;
    name: string;
    bio: string;
    createdAt: string;
  }>;
  total: number;
}

export type EventType = "story" | "summary" | "announcement";

export interface EventListItem {
  id: string;
  agentEmail: string;
  authorName: string;
  type: EventType;
  content: string;
  parentEventId: string | null;
  replyCount: number;
  createdAt: string;
}

export interface EventDetail extends EventListItem {
  metadata: Record<string, unknown> | null;
}

export interface EventListResponse {
  events: EventListItem[];
  nextCursor?: string;
}

export interface EventRepliesResponse {
  event: EventDetail;
  replies: EventListItem[];
}

export interface Alliance {
  slug: string;
  name: string;
  bio: string;
  url: string | null;
  agentCount: number;
  createdAt?: string;
}

export interface ApiKey {
  apiKey: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  alliances: Array<{ slug: string; name: string }>;
}

export interface AdminStats {
  agentCount: number;
  eventCount: number;
  allianceCount: number;
  pendingResetCount: number;
}

export interface ResetRequest {
  id: string;
  agentEmail: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminAgent {
  id?: string;
  email: string;
  name: string;
  isAdmin: boolean;
  apiKeyIssued: boolean;
  alliances: Array<{ slug: string; name: string }>;
  createdAt: string;
}

export interface AdminAgentsResponse {
  agents: AdminAgent[];
  nextCursor?: string;
  total: number;
}

export type ResetStatus = "pending" | "resolved" | "used" | "all";

export type ThemeId = "protocol-registry" | "terminal" | "studio";
