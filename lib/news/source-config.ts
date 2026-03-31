import { SourceDefinition } from "@/lib/news/types";

export const SOURCE_CATALOG: SourceDefinition[] = [
  {
    id: "eu-commission-presscorner",
    name: "欧盟委员会 Press Corner",
    sourceCategory: "RSS",
    fetchUrl: "https://ec.europa.eu/commission/presscorner/api/rss?language=en",
    homepage: "https://ec.europa.eu/commission/presscorner/home/en",
    authorityRank: 10,
    regionHints: ["europe"],
    tagHints: ["policy", "diplomacy", "regional-cooperation", "sanctions", "summit"]
  },
  {
    id: "europarl-press",
    name: "欧洲议会 Press Releases",
    sourceCategory: "RSS",
    fetchUrl: "https://www.europarl.europa.eu/rss/doc/press-releases/en.xml",
    homepage: "https://www.europarl.europa.eu/news/en/press-room",
    authorityRank: 9,
    regionHints: ["europe"],
    tagHints: ["parliament", "policy", "regional-cooperation"]
  },
  {
    id: "whitehouse-briefing-room",
    name: "白宫 Briefing Room",
    sourceCategory: "RSS",
    fetchUrl: "https://www.whitehouse.gov/briefing-room/feed/",
    homepage: "https://www.whitehouse.gov/briefing-room/",
    authorityRank: 10,
    regionHints: ["usa"],
    tagHints: ["policy", "diplomacy", "security", "summit"]
  },
  {
    id: "state-department",
    name: "美国国务院",
    sourceCategory: "RSS",
    fetchUrl: "https://www.state.gov/feed/",
    homepage: "https://www.state.gov/",
    authorityRank: 10,
    regionHints: ["usa"],
    tagHints: ["diplomacy", "policy", "security", "sanctions"]
  },
  {
    id: "asean-official",
    name: "ASEAN 官方",
    sourceCategory: "RSS",
    fetchUrl: "https://asean.org/feed/",
    homepage: "https://asean.org/",
    authorityRank: 9,
    regionHints: ["asean"],
    tagHints: ["regional-cooperation", "summit", "diplomacy", "policy"]
  },
  {
    id: "hungary-election-office",
    name: "匈牙利国家选举办公室",
    sourceCategory: "PAGE",
    fetchUrl: "https://www.valasztas.hu/en/2026-parliamentary-elections",
    homepage: "https://www.valasztas.hu/en/2026-parliamentary-elections",
    authorityRank: 10,
    regionHints: ["hungary-election", "europe"],
    tagHints: ["election", "policy"],
    requiresKeywords: ["election", "vote", "parliament", "commission", "candidate", "register"]
  }
];
