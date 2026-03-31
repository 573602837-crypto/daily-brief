export type RegionId = "europe" | "usa" | "asean" | "hungary-election";

export type TopicTag =
  | "diplomacy"
  | "policy"
  | "parliament"
  | "security"
  | "election"
  | "regional-cooperation"
  | "sanctions"
  | "summit";

export type SourceDefinition = {
  id: string;
  name: string;
  sourceCategory: "RSS" | "PAGE";
  fetchUrl: string;
  homepage: string;
  authorityRank: number;
  regionHints: RegionId[];
  tagHints?: TopicTag[];
  requiresKeywords?: string[];
};

export type RawArticleCandidate = {
  externalId: string;
  sourceId: string;
  sourceLabel: string;
  sourceCategory: "RSS" | "PAGE";
  url: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  authorityRank: number;
};

export type ClassifiedCandidate = RawArticleCandidate & {
  dedupeKey: string;
  regions: RegionId[];
  tags: TopicTag[];
  relevanceScore: number;
  summary: string;
};

export type DailyBriefCard = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  regions: RegionId[];
  tags: TopicTag[];
  summary: string;
};

export type DailyBriefView = {
  date: string;
  title: string;
  lead: string;
  generatedAt: string;
  sourceWindowLabel: string;
  itemCount: number;
  items: DailyBriefCard[];
};

export const REGION_LABELS: Record<RegionId, string> = {
  europe: "欧洲",
  usa: "美国",
  asean: "东盟",
  "hungary-election": "匈牙利选举"
};

export const TAG_LABELS: Record<TopicTag, string> = {
  diplomacy: "外交",
  policy: "政府政策",
  parliament: "议会动态",
  security: "安全事务",
  election: "选举进程",
  "regional-cooperation": "区域合作",
  sanctions: "制裁与协定",
  summit: "峰会声明"
};
