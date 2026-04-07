"use client";

import { DailyBriefView, REGION_LABELS, RegionId } from "@/lib/news/types";

type SourceCard = {
  id: string;
  name: string;
  homepage: string;
  regions: RegionId[];
};

type Props = {
  brief: DailyBriefView | null;
  sources: SourceCard[];
  timezone: string;
  sourceWindowHour: number;
};

export function DailyBriefApp({ brief, sources, timezone, sourceWindowHour }: Props) {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <section className="hero">
          <span className="eyebrow">Mobile First · Daily Brief</span>
          <h1 className="hero-title">今日国际时政日报</h1>
          <p className="hero-subtitle">
            首页固定分成四个互不重叠的板块：欧盟、美国、东盟、匈牙利选举。每个板块只使用对应地区媒体和独立关键词，不再交叉混选。
          </p>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">日报日期</span>
              <span className="stat-value">{brief?.date || "等待首次生成"}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">生成时间</span>
              <span className="stat-value">{brief?.generatedAt || `每日 ${sourceWindowHour}:00`}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">收录条数</span>
              <span className="stat-value">{brief?.itemCount || 0} 条</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">抓取窗口</span>
              <span className="stat-value">{brief?.sourceWindowLabel || `过去 24 小时 · ${timezone}`}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="toolbar" aria-label="板块导航">
            {(brief?.sections || []).map((section) => (
              <a className="chip" href={`#section-${section.id}`} key={section.id}>
                {section.label}
              </a>
            ))}
          </div>

          {brief ? (
            <>
              {brief.sections.map((section) => (
                <section className="section" id={`section-${section.id}`} key={section.id}>
                  <div className="empty-card">
                    <div className="card-topline">
                      <span className="source-pill">{section.label}</span>
                    </div>
                    <h2 className="card-title">{section.label}</h2>
                    <p className="hero-subtitle">{section.description}</p>
                  </div>
                  <div className="cards">
                    {section.items.map((item) => (
                      <article className="card" key={item.id}>
                        <div className="card-topline">
                          <span className="source-pill">{item.source}</span>
                          <span>{item.publishedAt}</span>
                        </div>
                        <h2 className="card-title">{item.title}</h2>
                        <div className="meta-row">
                          <span className="meta-pill">{REGION_LABELS[item.regions[0]]}</span>
                        </div>
                        <p className="summary">{item.summary}</p>
                        <a
                          className="card-link"
                          href={item.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          查看原文 →
                        </a>
                      </article>
                    ))}
                  </div>
                  {section.items.length === 0 ? (
                    <div className="empty-card">
                      当前板块在过去 24 小时内暂时没有满足关键词和来源规则的条目。
                    </div>
                  ) : null}
                </section>
              ))}
            </>
          ) : (
            <div className="empty-card">
              <strong>日报尚未生成。</strong>
              <p>
                网站已经准备好上线结构，部署后只需要配置数据库与定时任务，后台就会每天自动生成一份新的国际时政日报。
              </p>
            </div>
          )}
        </section>

        <section className="source-board">
          <h2 className="card-title">权威来源监测面板</h2>
          <p className="hero-subtitle">
            当前版本按四个独立板块组织，不再让欧盟、美国、东盟、匈牙利选举互相抢新闻。每条新闻只归属于一个板块。
          </p>
          <div className="source-list">
            {sources.map((source) => (
              <article className="source-item" key={source.id}>
                <h3>{source.name}</h3>
                <div className="meta-row">
                  {(source.regions || []).map((region) => (
                    <span className="meta-pill" key={`${source.id}-${region}`}>
                      {REGION_LABELS[region]}
                    </span>
                  ))}
                </div>
                <p className="footer-note">
                  后台先按板块关键词筛选，再抓正文生成摘要，尽量减少标签过多带来的错选问题。
                </p>
                <a className="source-link" href={source.homepage} rel="noreferrer" target="_blank">
                  打开来源入口
                </a>
              </article>
            ))}
          </div>
          <p className="footer-note">
            说明：当前版本默认按 {timezone} 时区组织日报，摘要会优先参考文章正文首段，而不是只靠 RSS 导语。
          </p>
        </section>
      </div>
    </main>
  );
}
