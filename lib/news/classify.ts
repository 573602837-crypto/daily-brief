import { BOARD_BY_ID } from "@/lib/news/boards";
import { buildBriefSummary } from "@/lib/news/summarize";
import { buildDedupeKey, normalizeTokens } from "@/lib/news/text";
import { RegionId, SourceDefinition, TopicTag } from "@/lib/news/types";

const COMMON_EXCLUDES = [
  "football",
  "soccer",
  "basketball",
  "tennis",
  "movie",
  "film",
  "music",
  "celebrity",
  "lifestyle",
  "fashion",
  "travel",
  "tourism",
  "restaurant",
  "concert",
  "weather",
  "earnings",
  "stock",
  "market close"
];

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function inferTags(board: RegionId, text: string): TopicTag[] {
  if (board === "hungary-election") {
    return ["election"];
  }

  if (board === "usa" && /\b(congress|senate|house|bill|budget)\b/i.test(text)) {
    return ["parliament", "policy"];
  }

  if (board === "europe" && /\b(sanction|tariff|agreement|deal)\b/i.test(text)) {
    return ["policy", "sanctions"];
  }

  if (board === "asean" && /\b(asean|summit|leaders|regional)\b/i.test(text)) {
    return ["regional-cooperation", "diplomacy"];
  }

  return ["policy"];
}

export function classifyArticle(
  source: SourceDefinition,
  title: string,
  excerpt: string,
  contentText?: string
): {
  regions: [RegionId];
  tags: TopicTag[];
  relevanceScore: number;
  summary: string;
  dedupeKey: string;
} | null {
  const board = BOARD_BY_ID[source.board];
  const fullText = `${title} ${excerpt} ${contentText || ""}`.toLowerCase();
  const includeKeywords = [...board.keywords, ...(source.includeKeywords || [])];
  const excludeKeywords = [...COMMON_EXCLUDES, ...board.excludeKeywords, ...(source.excludeKeywords || [])];
  const includeHits = countKeywordHits(fullText, includeKeywords);
  const excludeHits = countKeywordHits(fullText, excludeKeywords);

  if (includeHits < 2 && !includesKeyword(fullText, source.includeKeywords || [])) {
    return null;
  }

  if (excludeHits > 1) {
    return null;
  }

  if (board.id === "hungary-election") {
    const hasHungary = includesKeyword(fullText, ["hungary", "hungarian", "budapest", "orban", "orbán"]);
    const hasElection = includesKeyword(fullText, ["election", "vote", "candidate", "campaign", "ballot"]);

    if (!hasHungary || !hasElection) {
      return null;
    }
  }

  if (board.id === "europe" && includesKeyword(fullText, ["hungary election", "hungarian election"])) {
    return null;
  }

  const tags = inferTags(board.id, fullText);
  const normalizedTitle = normalizeTokens(title).join(" ");
  const dedupeKey = buildDedupeKey(`${board.id} ${normalizedTitle}`);
  const summary = buildBriefSummary({
    title,
    excerpt,
    contentText
  });
  const relevanceScore =
    source.authorityRank * 0.9 +
    includeHits * 1.8 +
    Math.min((contentText || excerpt).length / 420, 3);

  return {
    regions: [board.id],
    tags,
    relevanceScore,
    summary,
    dedupeKey
  };
}
