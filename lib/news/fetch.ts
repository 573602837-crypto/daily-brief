import { XMLParser } from "fast-xml-parser";

import { SourceDefinition, RawArticleCandidate } from "@/lib/news/types";
import {
  buildStableHash,
  cleanHtmlToText,
  extractDateFromText,
  extractTitleFromHtml,
  trimText
} from "@/lib/news/text";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: true
});

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parseDate(input: string | undefined): Date | null {
  if (!input) {
    return null;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildExternalId(source: SourceDefinition, seed: string): string {
  return `${source.id}:${buildStableHash(seed)}`;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "GlobalPoliticsDailyBot/0.1 (+https://example.com)"
    },
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchRssSource(source: SourceDefinition): Promise<RawArticleCandidate[]> {
  const xml = await fetchText(source.fetchUrl);
  const parsed = xmlParser.parse(xml);

  if (parsed?.rss?.channel?.item) {
    return ensureArray(parsed.rss.channel.item).reduce<RawArticleCandidate[]>(
      (items, item: Record<string, unknown>) => {
        const title = String(item.title || "").trim();
        const link = String(item.link || source.homepage).trim();
        const excerpt = cleanHtmlToText(
          String(item.description || item["content:encoded"] || item.summary || "")
        );
        const publishedAt =
          parseDate(String(item.pubDate || item.published || item.updated || "")) || new Date();

        if (!title || !link) {
          return items;
        }

        items.push({
          externalId: buildExternalId(source, `${title}:${link}:${publishedAt.toISOString()}`),
          sourceId: source.id,
          sourceLabel: source.name,
          sourceCategory: "RSS" as const,
          board: source.board,
          url: link,
          title,
          excerpt: trimText(excerpt || title, 360),
          publishedAt,
          authorityRank: source.authorityRank
        });

        return items;
      },
      []
    );
  }

  if (parsed?.feed?.entry) {
    return ensureArray(parsed.feed.entry).reduce<RawArticleCandidate[]>(
      (items, entry: Record<string, unknown>) => {
        const title = cleanHtmlToText(String(entry.title || "")).trim();
        const linkValue = entry.link;
        const firstLink = ensureArray(linkValue as Record<string, unknown>[])
          .map((value) => {
            if (typeof value === "string") {
              return value;
            }

            return String(value.href || value["href"] || "");
          })
          .find(Boolean);
        const summary = cleanHtmlToText(String(entry.summary || entry.content || ""));
        const publishedAt =
          parseDate(String(entry.updated || entry.published || entry.created || "")) || new Date();

        if (!title || !firstLink) {
          return items;
        }

        items.push({
          externalId: buildExternalId(source, `${title}:${firstLink}:${publishedAt.toISOString()}`),
          sourceId: source.id,
          sourceLabel: source.name,
          sourceCategory: "RSS" as const,
          board: source.board,
          url: firstLink,
          title,
          excerpt: trimText(summary || title, 360),
          publishedAt,
          authorityRank: source.authorityRank
        });

        return items;
      },
      []
    );
  }

  return [];
}

async function fetchPageSnapshotSource(source: SourceDefinition): Promise<RawArticleCandidate[]> {
  const html = await fetchText(source.fetchUrl);
  const title = extractTitleFromHtml(html);
  const excerpt = trimText(cleanHtmlToText(html), 360);
  const publishedAt = extractDateFromText(html) || extractDateFromText(excerpt);

  if (!publishedAt) {
    return [];
  }

  return [
    {
      externalId: buildExternalId(source, `${title}:${publishedAt.toISOString()}:${excerpt}`),
      sourceId: source.id,
      sourceLabel: source.name,
      sourceCategory: "PAGE",
      board: source.board,
      url: source.fetchUrl,
      title,
      excerpt,
      publishedAt,
      authorityRank: source.authorityRank
    }
  ];
}

export async function fetchSource(source: SourceDefinition): Promise<RawArticleCandidate[]> {
  if (source.sourceCategory === "RSS") {
    return fetchRssSource(source);
  }

  return fetchPageSnapshotSource(source);
}

function uniqueParagraphs(paragraphs: string[]): string[] {
  const seen = new Set<string>();

  return paragraphs.filter((paragraph) => {
    const normalized = paragraph.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
    if (normalized.length < 40 || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

export async function fetchArticleContent(url: string): Promise<string> {
  const html = await fetchText(url);
  const paragraphMatches = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi));
  const paragraphs = uniqueParagraphs(
    paragraphMatches
      .map((match) => cleanHtmlToText(match[1] || ""))
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
  )
    .filter((paragraph) => paragraph.length >= 60)
    .slice(0, 12);

  const fallback = cleanHtmlToText(html).slice(0, 2400);
  return trimText((paragraphs.join(" ") || fallback).trim(), 2400);
}
