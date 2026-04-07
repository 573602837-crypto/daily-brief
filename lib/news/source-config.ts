import { SourceDefinition } from "@/lib/news/types";

export const SOURCE_CATALOG: SourceDefinition[] = [
  {
    id: "politico-eu",
    name: "Politico EU",
    sourceCategory: "RSS",
    fetchUrl: "https://www.politico.eu/feed/",
    homepage: "https://www.politico.eu",
    authorityRank: 10,
    board: "europe",
    includeKeywords: ["european union", "eu", "brussels", "commission", "parliament"],
    excludeKeywords: ["hungary election", "sports"]
  },
  {
    id: "le-monde",
    name: "Le Monde",
    sourceCategory: "RSS",
    fetchUrl: "https://www.lemonde.fr/en/international/rss_full.xml",
    homepage: "https://www.lemonde.fr/en/",
    authorityRank: 9,
    board: "europe",
    includeKeywords: ["european union", "eu", "brussels", "european commission"]
  },
  {
    id: "guardian-europe",
    name: "The Guardian Europe",
    sourceCategory: "RSS",
    fetchUrl: "https://www.theguardian.com/world/europe-news/rss",
    homepage: "https://www.theguardian.com/world/europe-news",
    authorityRank: 9,
    board: "europe",
    includeKeywords: ["european union", "eu", "brussels", "european parliament"]
  },
  {
    id: "guardian-hungary",
    name: "The Guardian (Hungary)",
    sourceCategory: "RSS",
    fetchUrl: "https://www.theguardian.com/world/rss",
    homepage: "https://www.theguardian.com/world",
    authorityRank: 9,
    board: "hungary-election",
    includeKeywords: ["hungary", "election", "orban", "orbán", "candidate", "campaign"]
  },
  {
    id: "politico-eu-hungary",
    name: "Politico EU (Hungary)",
    sourceCategory: "RSS",
    fetchUrl: "https://www.politico.eu/feed/",
    homepage: "https://www.politico.eu",
    authorityRank: 10,
    board: "hungary-election",
    includeKeywords: ["hungary", "hungarian", "election", "orban", "orbán", "tisza"]
  },
  {
    id: "nyt-politics",
    name: "The New York Times Politics",
    sourceCategory: "RSS",
    fetchUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    homepage: "https://www.nytimes.com/section/politics",
    authorityRank: 10,
    board: "usa",
    includeKeywords: ["white house", "congress", "senate", "federal", "campaign", "election"]
  },
  {
    id: "washington-post-politics",
    name: "The Washington Post Politics",
    sourceCategory: "RSS",
    fetchUrl: "https://feeds.washingtonpost.com/rss/politics",
    homepage: "https://www.washingtonpost.com/politics/",
    authorityRank: 10,
    board: "usa",
    includeKeywords: ["white house", "congress", "senate", "administration", "campaign"]
  },
  {
    id: "washington-post-world-us",
    name: "The Washington Post World",
    sourceCategory: "RSS",
    fetchUrl: "https://feeds.washingtonpost.com/rss/world",
    homepage: "https://www.washingtonpost.com/world/",
    authorityRank: 9,
    board: "usa",
    includeKeywords: ["white house", "washington", "state department", "us foreign policy", "congress"]
  },
  {
    id: "cna-asia",
    name: "CNA Asia",
    sourceCategory: "RSS",
    fetchUrl: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
    homepage: "https://www.channelnewsasia.com/asia",
    authorityRank: 10,
    board: "asean",
    includeKeywords: ["asean", "singapore", "malaysia", "indonesia", "thailand", "philippines", "vietnam"]
  },
  {
    id: "bangkok-post-world",
    name: "Bangkok Post",
    sourceCategory: "RSS",
    fetchUrl: "https://www.bangkokpost.com/rss/data/world.xml",
    homepage: "https://www.bangkokpost.com",
    authorityRank: 9,
    board: "asean",
    includeKeywords: ["thailand", "asean", "myanmar", "cambodia", "laos", "vietnam"]
  },
  {
    id: "jakarta-post",
    name: "The Jakarta Post",
    sourceCategory: "RSS",
    fetchUrl: "https://www.thejakartapost.com/rss",
    homepage: "https://www.thejakartapost.com",
    authorityRank: 9,
    board: "asean",
    includeKeywords: ["indonesia", "asean", "jakarta", "south china sea", "regional"]
  },
  {
    id: "straits-times-asia",
    name: "The Straits Times",
    sourceCategory: "RSS",
    fetchUrl: "https://www.straitstimes.com/news/asia/rss.xml",
    homepage: "https://www.straitstimes.com",
    authorityRank: 9,
    board: "asean",
    includeKeywords: ["singapore", "asean", "southeast asia", "manila", "jakarta", "bangkok"]
  }
];
