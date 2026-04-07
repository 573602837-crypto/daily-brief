const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "about",
  "after",
  "before",
  "have",
  "has",
  "will",
  "their",
  "they",
  "them",
  "over",
  "under",
  "amid",
  "says",
  "said",
  "statement",
  "press",
  "news",
  "briefing",
  "update"
]);

export function cleanHtmlToText(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimText(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function buildExcerptLead(input: string, maxLength = 120): string {
  const cleaned = input
    .replace(/\([^)]+(reuters|ap|afp)[^)]+\)/gi, " ")
    .replace(/\bBy\s+[A-Z][A-Za-z.\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const sentences = cleaned
    .split(/(?<=[.!?。；;])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18);

  const lead = sentences.slice(0, 2).join(" ");
  return trimText(lead || cleaned, maxLength);
}

export function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function buildStableHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function buildDedupeKey(title: string): string {
  const tokens = Array.from(new Set(normalizeTokens(title))).slice(0, 10);
  return tokens.join("-");
}

export function extractTitleFromHtml(html: string): string {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    return cleanHtmlToText(h1Match[1]);
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return cleanHtmlToText(titleMatch[1]);
  }

  return "Untitled";
}

export function extractDateFromText(text: string): Date | null {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?/);
  if (isoMatch?.[0]) {
    const parsed = new Date(isoMatch[0]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const englishMatch = text.match(
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+20\d{2}\b/i
  );
  if (englishMatch?.[0]) {
    const parsed = new Date(englishMatch[0]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}
