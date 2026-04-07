import { trimText } from "@/lib/news/text";

const TERM_MAP: Array<[RegExp, string]> = [
  [/\bthe white house\b/gi, "白宫"],
  [/\bstate department\b/gi, "美国国务院"],
  [/\bforeign minister\b/gi, "外长"],
  [/\bforeign ministry\b/gi, "外交部"],
  [/\bprime minister\b/gi, "总理"],
  [/\bpresident\b/gi, "总统"],
  [/\bgovernment\b/gi, "政府"],
  [/\bcabinet\b/gi, "内阁"],
  [/\bparliament\b/gi, "议会"],
  [/\bcongress\b/gi, "国会"],
  [/\bsenate\b/gi, "参议院"],
  [/\beuropean union\b/gi, "欧盟"],
  [/\beuropean commission\b/gi, "欧盟委员会"],
  [/\beuropean parliament\b/gi, "欧洲议会"],
  [/\beuropean council\b/gi, "欧洲理事会"],
  [/\bunited states\b/gi, "美国"],
  [/\bu\.s\.\b/gi, "美国"],
  [/\bu\.s\b/gi, "美国"],
  [/\bwashington\b/gi, "华盛顿"],
  [/\basean\b/gi, "东盟"],
  [/\bhungary\b/gi, "匈牙利"],
  [/\bhungarian\b/gi, "匈牙利"],
  [/\borban\b/gi, "欧尔班"],
  [/\borbán\b/gi, "欧尔班"],
  [/\bopposition\b/gi, "反对派"],
  [/\bruling party\b/gi, "执政党"],
  [/\belection\b/gi, "选举"],
  [/\bcandidate\b/gi, "候选人"],
  [/\bcampaign\b/gi, "竞选"],
  [/\bvote\b/gi, "投票"],
  [/\bsanctions\b/gi, "制裁"],
  [/\bceasefire\b/gi, "停火"],
  [/\bsummit\b/gi, "峰会"],
  [/\bagreement\b/gi, "协议"],
  [/\bdeal\b/gi, "协议"],
  [/\bpolicy\b/gi, "政策"],
  [/\bbill\b/gi, "法案"],
  [/\bbudget\b/gi, "预算"],
  [/\bsecurity\b/gi, "安全"],
  [/\bdefense\b/gi, "防务"],
  [/\bannounce(?:s|d)?\b/gi, "宣布"],
  [/\bapprove(?:s|d)?\b/gi, "批准"],
  [/\bpass(?:es|ed)?\b/gi, "通过"],
  [/\breject(?:s|ed)?\b/gi, "否决"],
  [/\bwarn(?:s|ed)?\b/gi, "警告"],
  [/\bmeet(?:s|ing|ing with)?\b/gi, "会谈"],
  [/\bseek(?:s|ing)?\b/gi, "寻求"],
  [/\bpush(?:es|ed)?\b/gi, "推动"],
  [/\bplan(?:s|ned)?\b/gi, "计划"]
];

const NOISE_PATTERNS = [
  /^live:\s*/i,
  /^analysis:\s*/i,
  /^watch:\s*/i,
  /^breaking:\s*/i,
  /\s*\|\s*.+$/i,
  /\s*-\s*(live|analysis|opinion|latest updates?)$/i
];

function cleanEnglishSnippet(input: string): string {
  let text = input
    .replace(/\([^)]+(reuters|ap|afp)[^)]+\)/gi, " ")
    .replace(/\bby\s+[A-Z][A-Za-z.\s-]+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();

  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, "").trim();
  }

  return text;
}

function translateTerms(input: string): string {
  let text = cleanEnglishSnippet(input);

  for (const [pattern, replacement] of TERM_MAP) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/\b(the|a|an|to|of|in|on|at|for|from|with|amid|after|before|over|under)\b/gi, " ")
    .replace(/\s*[,/]\s*/g, "，")
    .replace(/\s*;\s*/g, "；")
    .replace(/\s*:\s*/g, "：")
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/g, "")
    .trim();
}

export function buildChineseHeadline(title: string): string {
  return trimText(translateTerms(title), 48);
}

function chineseCharacterCount(input: string): number {
  const matches = input.match(/[\u4e00-\u9fa5]/g);
  return matches ? matches.length : 0;
}

function asciiLetterCount(input: string): number {
  const matches = input.match(/[A-Za-z]/g);
  return matches ? matches.length : 0;
}

function cleanSummaryForHeadline(input: string): string {
  return input
    .replace(/^主要围绕/, "")
    .replace(/^报道提到，/, "")
    .replace(/^并指出，/, "")
    .replace(/，重点落在.+$/, "")
    .replace(/[；。].*$/, "")
    .trim();
}

export function buildReadableChineseHeadline(title: string, fallbackText?: string): string {
  const translatedTitle = buildChineseHeadline(title);
  const chineseCount = chineseCharacterCount(translatedTitle);
  const asciiCount = asciiLetterCount(translatedTitle);

  if (chineseCount >= 6 && asciiCount <= chineseCount) {
    return translatedTitle;
  }

  const fallbackSentence = splitIntoSentences(fallbackText || "")[0];
  if (fallbackSentence) {
    return trimText(cleanSummaryForHeadline(fallbackSentence), 32);
  }

  const strippedTitle = translatedTitle.replace(/[A-Za-z][A-Za-z0-9' -]*/g, " ").replace(/\s+/g, " ").trim();
  if (chineseCharacterCount(strippedTitle) >= 6) {
    return trimText(strippedTitle, 32);
  }

  return translatedTitle;
}

function splitIntoSentences(input: string): string[] {
  return translateTerms(input)
    .split(/(?<=[.!?。；;])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 12);
}

function normalizeForCompare(input: string): string {
  return input.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase();
}

function isDifferentEnough(base: string, candidate: string): boolean {
  const a = normalizeForCompare(base);
  const b = normalizeForCompare(candidate);
  return a.length > 8 && b.length > 8 && !a.includes(b) && !b.includes(a);
}

function pickDetailSentences(title: string, bodyText: string): string[] {
  const titleNorm = normalizeForCompare(title);
  const picked: string[] = [];

  for (const sentence of splitIntoSentences(bodyText)) {
    const normalized = normalizeForCompare(sentence);
    if (normalized.length < 18 || normalized.includes(titleNorm) || titleNorm.includes(normalized)) {
      continue;
    }

    picked.push(sentence);
    if (picked.length >= 2) {
      break;
    }
  }

  return picked;
}

export function buildBriefSummary(params: {
  title: string;
  excerpt: string;
  contentText?: string;
}): string {
  const titleLead = trimText(buildReadableChineseHeadline(params.title, params.contentText || params.excerpt), 40);
  const bodySource = params.contentText || params.excerpt;
  const details = pickDetailSentences(params.title, bodySource);

  if (details.length >= 2 && isDifferentEnough(details[0], details[1])) {
    return trimText(`${titleLead}；报道提到，${details[0]}；并指出，${details[1]}。`, 105);
  }

  if (details.length === 1) {
    return trimText(`${titleLead}；报道提到，${details[0]}。`, 92);
  }

  const fallback = trimText(translateTerms(params.excerpt || params.title), 56);
  return trimText(`${titleLead}；主要围绕${fallback}。`, 88);
}
