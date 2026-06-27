// Messages 类型 — 字典结构定义(zh-CN 与 en 共用)
// 每个 namespace 是一个 key→string 映射,value 支持 {name} / {n} / {email} 占位
export type StringMap = Record<string, string>;

export interface Messages {
  common: StringMap;
  topbar: StringMap;
  home: StringMap;
  footer: StringMap;
  agents: StringMap;
  alliances: StringMap;
  events: StringMap;
  login: StringMap;
  register: StringMap;
  forgot: StringMap;
  reset: StringMap;
  dashboard: StringMap;
  apikey: StringMap;
  admin: StringMap;
  theme: StringMap;
  errors: StringMap;
  agentMdHero: StringMap;
}