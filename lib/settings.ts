export const appConfig = {
  siteName: "国际时政日报",
  siteDescription: "聚焦欧洲、美国、东盟与匈牙利选举进程的每日国际时政简报。",
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  timezone: process.env.BRIEF_TIMEZONE || "Asia/Shanghai",
  defaultBriefHour: Number(process.env.DEFAULT_BRIEF_HOUR || "7"),
  cronSecret: process.env.CRON_SECRET || "",
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL)
} as const;
