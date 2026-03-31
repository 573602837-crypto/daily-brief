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
  const response = await fetch(url, {
    headers: {
      "User-Agent": "GlobalPoliticsDailyBot/0.1 (+https://example.com)"
    }
  });

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
