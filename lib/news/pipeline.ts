import { prisma } from "@/lib/db";
import { appConfig } from "@/lib/settings";
import { classifyArticle } from "@/lib/news/classify";
import { fetchSource } from "@/lib/news/fetch";
import { SOURCE_CATALOG } from "@/lib/news/source-config";
import { ClassifiedCandidate, RegionId } from "@/lib/news/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
type CandidateLike = {
  dedupeKey: string;
  relevanceScore: number;
};
type PersistedCandidate = ClassifiedCandidate & {
  id: string;
};

function formatBriefDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: appConfig.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function dedupeCandidates<T extends CandidateLike>(candidates: T[]): T[] {
  const bestByKey = new Map<string, T>();

  for (const candidate of candidates) {
    const existing = bestByKey.get(candidate.dedupeKey);
    if (!existing || candidate.relevanceScore > existing.relevanceScore) {
      bestByKey.set(candidate.dedupeKey, candidate);
    }
  }

  return Array.from(bestByKey.values());
}

function selectBalancedArticles<T extends ClassifiedCandidate>(candidates: T[], limit = 12): T[] {
  const sorted = [...candidates].sort((left, right) => right.relevanceScore - left.relevanceScore);
  const selected: T[] = [];
  const remaining = [...sorted];
  const priorityRegions: RegionId[] = ["europe", "usa", "asean", "hungary-election"];

  for (const region of priorityRegions) {
    const index = remaining.findIndex((candidate) => candidate.regions.includes(region));
    if (index >= 0) {
      selected.push(remaining.splice(index, 1)[0]);
    }
  }

  while (selected.length < limit && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }

  return selected.slice(0, limit);
}

function buildLead(candidates: ClassifiedCandidate[]): string {
  const seenRegions = new Set(candidates.flatMap((candidate) => candidate.regions));
  const coverage = [
    seenRegions.has("europe") ? "欧洲" : null,
    seenRegions.has("usa") ? "美国" : null,
    seenRegions.has("asean") ? "东盟" : null,
    seenRegions.has("hungary-election") ? "匈牙利选举" : null
  ]
    .filter(Boolean)
    .join("、");

  return coverage
    ? `本期聚焦${coverage}过去 24 小时的重要外交、政策、议会与安全动态。`
    : "本期聚焦过去 24 小时内权威来源发布的国际时政动态。";
}

export async function runDailyPipeline(now = new Date()) {
  if (!appConfig.hasDatabaseUrl) {
    throw new Error("DATABASE_URL is required to run the pipeline.");
  }

  const windowStart = new Date(now.getTime() - DAY_IN_MS);
  const settled = await Promise.allSettled(SOURCE_CATALOG.map((source) => fetchSource(source)));
  const rawCandidates = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  const classified = rawCandidates
    .filter((candidate) => candidate.publishedAt >= windowStart)
    .map((candidate) => {
      const source = SOURCE_CATALOG.find((item) => item.id === candidate.sourceId);
      if (!source) {
        return null;
      }

      const classification = classifyArticle(source, candidate.title, candidate.excerpt);
      if (!classification) {
        return null;
      }

      return {
        ...candidate,
        ...classification
      };
    })
    .filter((candidate): candidate is ClassifiedCandidate => Boolean(candidate));

  const deduped = dedupeCandidates(classified);

  for (const item of deduped) {
    await prisma.article.upsert({
      where: { externalId: item.externalId },
      update: {
        title: item.title,
        summary: item.summary,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        authorityRank: item.authorityRank,
        relevanceScore: item.relevanceScore,
        dedupeKey: item.dedupeKey,
        regions: item.regions,
        tags: item.tags
      },
      create: {
        externalId: item.externalId,
        sourceId: item.sourceId,
        sourceLabel: item.sourceLabel,
        sourceCategory: item.sourceCategory,
        url: item.url,
        title: item.title,
        summary: item.summary,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        authorityRank: item.authorityRank,
        relevanceScore: item.relevanceScore,
        dedupeKey: item.dedupeKey,
        regions: item.regions,
        tags: item.tags
      }
    });
  }

  const recentArticles = await prisma.article.findMany({
    where: {
      publishedAt: {
        gte: windowStart
      }
    },
    orderBy: [{ relevanceScore: "desc" }, { publishedAt: "desc" }]
  });

  const recentCandidatePool: PersistedCandidate[] = recentArticles.map((article) => ({
    id: article.id,
    externalId: article.externalId,
    sourceId: article.sourceId,
    sourceLabel: article.sourceLabel,
    sourceCategory: article.sourceCategory === "PAGE" ? "PAGE" : "RSS",
    url: article.url,
    title: article.title,
    summary: article.summary,
    excerpt: article.excerpt || article.summary,
    publishedAt: article.publishedAt,
    authorityRank: article.authorityRank,
    relevanceScore: article.relevanceScore,
    dedupeKey: article.dedupeKey,
    regions: article.regions as PersistedCandidate["regions"],
    tags: article.tags as PersistedCandidate["tags"]
  }));

  const selected = selectBalancedArticles(dedupeCandidates(recentCandidatePool));

  const briefDate = formatBriefDate(now);
  const title = `${briefDate} 国际时政日报`;
  const lead = buildLead(selected);

  const brief = await prisma.dailyBrief.upsert({
    where: { briefDate },
    update: {
      title,
      lead,
      generatedAt: now,
      sourceWindowStart: windowStart,
      sourceWindowEnd: now
    },
    create: {
      briefDate,
      title,
      lead,
      generatedAt: now,
      sourceWindowStart: windowStart,
      sourceWindowEnd: now
    }
  });

  await prisma.dailyBriefItem.deleteMany({
    where: {
      briefId: brief.id
    }
  });

  if (selected.length > 0) {
    await prisma.dailyBriefItem.createMany({
      data: selected.map((article, index) => ({
        briefId: brief.id,
        articleId: article.id,
        position: index + 1,
        highlightScore: article.relevanceScore
      }))
    });
  }

  return {
    briefDate,
    fetched: rawCandidates.length,
    saved: deduped.length,
    selected: selected.length,
    failures: settled
      .map((result, index) =>
        result.status === "rejected"
          ? {
              sourceId: SOURCE_CATALOG[index]?.id,
              message: result.reason instanceof Error ? result.reason.message : "Unknown error"
            }
          : null
      )
      .filter(Boolean)
  };
}
