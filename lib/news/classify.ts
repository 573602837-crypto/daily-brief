import { RegionId, TAG_LABELS, TopicTag, REGION_LABELS, SourceDefinition } from "@/lib/news/types";
import { buildDedupeKey, normalizeTokens, trimText } from "@/lib/news/text";

const REGION_KEYWORDS: Record<RegionId, string[]> = {
  europe: [
    "europe",
    "european",
    "eu",
    "brussels",
    "commission",
    "parliament",
    "council",
    "nato"
  ],
  usa: [
    "united states",
    "u.s.",
    "us",
    "washington",
    "state department",
    "white house",
    "congress",
    "senate"
  ],
  asean: [
    "asean",
    "southeast asia",
    "jakarta",
    "singapore",
    "vietnam",
    "thailand",
    "philippines",
    "malaysia",
    "indonesia"
  ],
  "hungary-election": [
    "hungary",
    "hungarian",
    "budapest",
    "election",
    "vote",
    "candidate",
    "ballot",
    "national election office",
    "national election commission"
  ]
};

const TAG_KEYWORDS: Record<TopicTag, string[]> = {
  diplomacy: ["diplomacy", "foreign", "bilateral", "minister", "envoy", "statement"],
  policy: ["policy", "law", "measure", "plan", "regulation", "government", "cabinet"],
  parliament: ["parliament", "congress", "senate", "assembly", "legislation", "committee"],
  security: ["security", "defense", "military", "missile", "border", "threat", "sanction"],
  election: ["election", "vote", "voter", "ballot", "candidate", "poll", "register"],
  "regional-cooperation": [
    "cooperation",
    "partnership",
    "joint",
    "regional",
    "asean",
    "union",
    "agreement"
  ],
  sanctions: ["sanction", "restrictive", "agreement", "accord", "treaty", "tariff"],
  summit: ["summit", "leaders", "meeting", "communique", "declaration", "forum"]
};

const EXCLUDE_KEYWORDS = [
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
  "weather",
  "earnings",
  "stock",
  "market close"
];

function includesKeyword(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function collectMatches(haystack: string, dictionary: Record<string, string[]>): string[] {
  return Object.entries(dictionary)
    .filter(([, keywords]) => includesKeyword(haystack, keywords))
    .map(([key]) => key);
}

export function classifyArticle(
  source: SourceDefinition,
  title: string,
  excerpt: string
): {
  regions: RegionId[];
  tags: TopicTag[];
  relevanceScore: number;
  summary: string;
  dedupeKey: string;
} | null {
  const text = `${title} ${excerpt}`.toLowerCase();
  const normalizedTitle = normalizeTokens(title).join(" ");
  const matchedRegions = new Set<RegionId>(source.regionHints);
  const matchedTags = new Set<TopicTag>(source.tagHints || []);

  collectMatches(text, REGION_KEYWORDS).forEach((value) => matchedRegions.add(value as RegionId));
  collectMatches(text, TAG_KEYWORDS).forEach((value) => matchedTags.add(value as TopicTag));

  const includeHits = Array.from(matchedTags).length + Array.from(matchedRegions).length;
  const excludeHits = EXCLUDE_KEYWORDS.filter((keyword) => text.includes(keyword)).length;

  if (source.requiresKeywords?.length && !includesKeyword(text, source.requiresKeywords)) {
    return null;
  }

  if (!matchedRegions.size || !matchedTags.size) {
    return null;
  }

  if (excludeHits > includeHits) {
    return null;
  }

  const primaryTags = Array.from(matchedTags)
    .slice(0, 2)
    .map((tag) => TAG_LABELS[tag])
    .join("、");
  const primaryRegions = Array.from(matchedRegions)
    .slice(0, 2)
    .map((region) => REGION_LABELS[region])
    .join(" / ");
  const cleanTitle = trimText(title.replace(/\s+/g, " ").trim(), 38);
  const summary = `${source.name}发布《${cleanTitle}》，重点涉及${primaryTags}，归类为${primaryRegions}动态。建议结合原文核对声明、议程或政策细节。`;
  const dedupeKey = buildDedupeKey(`${normalizedTitle} ${Array.from(matchedRegions).join(" ")}`);
  const relevanceScore =
    source.authorityRank * 0.8 +
    Array.from(matchedRegions).length * 1.4 +
    Array.from(matchedTags).length * 1.6 +
    Math.min(excerpt.length / 160, 2);

  return {
    regions: Array.from(matchedRegions),
    tags: Array.from(matchedTags),
    relevanceScore,
    summary,
    dedupeKey
  };
}
