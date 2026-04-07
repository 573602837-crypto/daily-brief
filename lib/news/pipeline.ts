import { prisma } from "@/lib/db";
import { appConfig } from "@/lib/settings";
import { BOARD_DEFINITIONS, BOARD_BY_ID } from "@/lib/news/boards";
import { classifyArticle } from "@/lib/news/classify";
import { fetchArticleContent, fetchSource } from "@/lib/news/fetch";
import { SOURCE_CATALOG } from "@/lib/news/source-config";
import { ClassifiedCandidate, RawArticleCandidate, RegionId } from "@/lib/news/types";

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

function buildLead(): string {
  return "本期按四个独立板块编排：欧盟、美国、东盟、匈牙利选举。每个板块只从对应地区媒体中按独立关键词抓取，不再相互混合。";
}

function buildBoardOrderedSelection(candidates: PersistedCandidate[]): PersistedCandidate[] {
  const selected: PersistedCandidate[] = [];

  for (const board of BOARD_DEFINITIONS) {
    const boardItems = dedupeCandidates(
      candidates
        .filter((candidate) => candidate.regions[0] === board.id)
        .sort((left, right) => right.relevanceScore - left.relevanceScore)
    ).slice(0, board.desiredCount);

    selected.push(...boardItems);
  }

  return selected;
}

async function enrichCandidates(candidates: RawArticleCandidate[]): Promise<RawArticleCandidate[]> {
  const settled = await Promise.allSettled(
    candidates.map(async (candidate) => ({
      ...candidate,
      contentText: await fetchArticleContent(candidate.url)
    }))
  );

  return settled.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return candidates[index];
  });
}

function preliminarilyScopeCandidates(candidates: RawArticleCandidate[]): RawArticleCandidate[] {
  return candidates.filter((candidate) => {
    const source = SOURCE_CATALOG.find((item) => item.id === candidate.sourceId);
    if (!source) {
      return false;
    }

    const board = BOARD_BY_ID[source.board];
    const text = `${candidate.title} ${candidate.excerpt}`.toLowerCase();
    const boardHits = board.keywords.filter((keyword) => text.includes(keyword)).length;
    const sourceHits = (source.includeKeywords || []).filter((keyword) => text.includes(keyword)).length;

    return boardHits + sourceHits > 0;
  });
}

export async function runDailyPipeline(now = new Date()) {
  if (!appConfig.hasDatabaseUrl) {
    throw new Error("DATABASE_URL is required to run the pipeline.");
  }

  const windowStart = new Date(now.getTime() - DAY_IN_MS);
  const settled = await Promise.allSettled(SOURCE_CATALOG.map((source) => fetchSource(source)));
  const rawCandidates = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const recentCandidates = rawCandidates.filter((candidate) => candidate.publishedAt >= windowStart);
  const scopedCandidates = preliminarilyScopeCandidates(recentCandidates);
  const enrichedCandidates = await enrichCandidates(scopedCandidates);

  const classified = enrichedCandidates
    .map((candidate) => {
      const source = SOURCE_CATALOG.find((item) => item.id === candidate.sourceId);
      if (!source) {
        return null;
      }

      const classification = classifyArticle(
        source,
        candidate.title,
        candidate.excerpt,
        candidate.contentText
      );

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
        excerpt: item.contentText || item.excerpt,
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
        excerpt: item.contentText || item.excerpt,
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
    board: (article.regions[0] as RegionId) || "europe",
    url: article.url,
    title: article.title,
    summary: article.summary,
    excerpt: article.excerpt || article.summary,
    contentText: article.excerpt || article.summary,
    publishedAt: article.publishedAt,
    authorityRank: article.authorityRank,
    relevanceScore: article.relevanceScore,
    dedupeKey: article.dedupeKey,
    regions: [(article.regions[0] as RegionId) || "europe"],
    tags: article.tags as PersistedCandidate["tags"]
  }));

  const selected = buildBoardOrderedSelection(recentCandidatePool);
  const briefDate = formatBriefDate(now);
  const title = `${briefDate} 国际时政日报`;
  const lead = buildLead();

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
    scoped: scopedCandidates.length,
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
