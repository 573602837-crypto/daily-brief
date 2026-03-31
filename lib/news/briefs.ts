import { prisma } from "@/lib/db";
import { appConfig } from "@/lib/settings";
import { DailyBriefView } from "@/lib/news/types";

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: appConfig.timezone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export async function getLatestDailyBrief(): Promise<DailyBriefView | null> {
  if (!appConfig.hasDatabaseUrl) {
    return null;
  }

  try {
    const brief = await prisma.dailyBrief.findFirst({
      orderBy: [{ briefDate: "desc" }],
      include: {
        items: {
          orderBy: [{ position: "asc" }],
          include: {
            article: true
          }
        }
      }
    });

    if (!brief) {
      return null;
    }

    return {
      date: brief.briefDate,
      title: brief.title,
      lead: brief.lead,
      generatedAt: formatDateTime(brief.generatedAt),
      sourceWindowLabel: `${formatDateTime(brief.sourceWindowStart)} - ${formatDateTime(brief.sourceWindowEnd)}`,
      itemCount: brief.items.length,
      items: brief.items.map((item) => ({
        id: item.article.id,
        title: item.article.title,
        source: item.article.sourceLabel,
        publishedAt: formatDateTime(item.article.publishedAt),
        url: item.article.url,
        regions: item.article.regions as DailyBriefView["items"][number]["regions"],
        tags: item.article.tags as DailyBriefView["items"][number]["tags"],
        summary: item.article.summary
      }))
    };
  } catch {
    return null;
  }
}
