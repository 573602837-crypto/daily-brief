import { prisma } from "@/lib/db";
import { BOARD_DEFINITIONS } from "@/lib/news/boards";
import { appConfig } from "@/lib/settings";
import { DailyBriefView, RegionId } from "@/lib/news/types";

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

    const items = brief.items.map((item) => ({
      id: item.article.id,
      title: item.article.title,
      source: item.article.sourceLabel,
      publishedAt: formatDateTime(item.article.publishedAt),
      url: item.article.url,
      regions: [((item.article.regions[0] as RegionId) || "europe")] as DailyBriefView["items"][number]["regions"],
      tags: item.article.tags as DailyBriefView["items"][number]["tags"],
      summary: item.article.summary
    }));

    return {
      date: brief.briefDate,
      title: brief.title,
      lead: brief.lead,
      generatedAt: formatDateTime(brief.generatedAt),
      sourceWindowLabel: `${formatDateTime(brief.sourceWindowStart)} - ${formatDateTime(brief.sourceWindowEnd)}`,
      itemCount: items.length,
      items,
      sections: BOARD_DEFINITIONS.map((board) => ({
        id: board.id,
        label: board.label,
        description: board.description,
        items: items.filter((item) => item.regions[0] === board.id)
      }))
    };
  } catch {
    return null;
  }
}
