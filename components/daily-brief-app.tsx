"use client";

import { useState } from "react";

import { DailyBriefView, REGION_LABELS, RegionId, TAG_LABELS } from "@/lib/news/types";

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

const FILTERS: Array<{ id: "all" | RegionId; label: string }> = [
  { id: "all", label: "全部" },
  { id: "europe", label: "欧洲" },
  { id: "usa", label: "美国" },
  { id: "asean", label: "东盟" },
  { id: "hungary-election", label: "匈牙利选举" }
];

export function DailyBriefApp({ brief, sources, timezone, sourceWindowHour }: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | RegionId>("all");

  const filteredItems =
    brief?.items.filter((item) =>
      activeFilter === "all" ? true : item.regions.includes(activeFilter)
    ) || [];

  return (
    <main className="page-shell">
      <div className="page-frame">
        <section className="hero">
          <span className="eyebrow">Mobile First · Daily Brief</span>
          <h1 className="hero-title">今日国际时政日报</h1>
          <p className="hero-subtitle">
            聚焦欧洲、美国、东盟与匈牙利选举进程。默认取过去 24 小时内的权威来源，自动筛选外交、政策、议会、安全、选举与区域合作相关内容。
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
          <div className="toolbar" aria-label="区域筛选">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`chip ${activeFilter === filter.id ? "chip-active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {brief ? (
            <>
              <div className="cards">
                {filteredItems.map((item) => (
                  <article className="card" key={item.id}>
                    <div className="card-topline">
                      <span className="source-pill">{item.source}</span>
                      <span>{item.publishedAt}</span>
                    </div>
                    <h2 className="card-title">{item.title}</h2>
                    <div className="meta-row">
                      {item.regions.map((region) => (
                        <span className="meta-pill" key={`${item.id}-${region}`}>
                          {REGION_LABELS[region]}
                        </span>
                      ))}
                    </div>
                    <div className="tag-row">
                      {item.tags.map((tag) => (
                        <span className="tag-pill" key={`${item.id}-${tag}`}>
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
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
              {filteredItems.length === 0 ? (
                <div className="empty-card">
                  当前筛选区域暂时没有符合规则的条目。系统仍会继续按权威来源和过去 24 小时窗口自动更新。
                </div>
              ) : null}
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
            当前 MVP 优先使用官方机构与正规新闻入口，先保证准确性和可读性，再逐步扩展新闻覆盖广度。
          </p>
          <div className="source-list">
            {sources.map((source) => (
              <article className="source-item" key={source.id}>
                <h3>{source.name}</h3>
                <div className="meta-row">
                  {source.regions.map((region) => (
                    <span className="meta-pill" key={`${source.id}-${region}`}>
                      {REGION_LABELS[region]}
                    </span>
                  ))}
                </div>
                <p className="footer-note">
                  后台抓取时会结合区域提示、关键词和主题规则过滤掉娱乐、体育、纯商业波动等非时政内容。
                </p>
                <a className="source-link" href={source.homepage} rel="noreferrer" target="_blank">
                  打开来源入口
                </a>
              </article>
            ))}
          </div>
          <p className="footer-note">
            说明：当前版本默认按 {timezone} 时区组织日报，并以“宁少勿杂”为原则优先保留更权威、更贴近外交与政策议题的条目。
          </p>
        </section>
      </div>
    </main>
  );
}
