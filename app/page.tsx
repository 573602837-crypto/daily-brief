import { DailyBriefApp } from "@/components/daily-brief-app";
import { getLatestDailyBrief } from "@/lib/news/briefs";
import { SOURCE_CATALOG } from "@/lib/news/source-config";
import { appConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const brief = await getLatestDailyBrief();

  return (
    <DailyBriefApp
      brief={brief}
      sourceWindowHour={appConfig.defaultBriefHour}
      timezone={appConfig.timezone}
      sources={SOURCE_CATALOG.map((source) => ({
        id: source.id,
        name: source.name,
        homepage: source.homepage,
        regions: [source.board]
      }))}
    />
  );
}
