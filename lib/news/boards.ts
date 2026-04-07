import { REGION_LABELS, RegionId } from "@/lib/news/types";

export type BoardDefinition = {
  id: RegionId;
  label: string;
  description: string;
  keywords: string[];
  excludeKeywords: string[];
  desiredCount: number;
};

export const BOARD_DEFINITIONS: BoardDefinition[] = [
  {
    id: "europe",
    label: REGION_LABELS.europe,
    description: "只关注欧盟机构、欧盟政策、布鲁塞尔议程、欧盟对外关系与制裁协定。",
    keywords: [
      "european union",
      "eu",
      "european commission",
      "european parliament",
      "european council",
      "brussels",
      "commission",
      "eu leaders",
      "eu sanctions",
      "bloc"
    ],
    excludeKeywords: ["hungary election", "hungarian election", "budapest mayor", "football"],
    desiredCount: 4
  },
  {
    id: "usa",
    label: REGION_LABELS.usa,
    description: "只关注美国联邦政治、白宫、国会、选举、司法与对外政策。",
    keywords: [
      "white house",
      "washington",
      "congress",
      "senate",
      "house",
      "federal",
      "administration",
      "state department",
      "supreme court",
      "campaign",
      "election"
    ],
    excludeKeywords: ["hollywood", "nba", "nfl", "celebrity"],
    desiredCount: 4
  },
  {
    id: "asean",
    label: REGION_LABELS.asean,
    description: "只关注东盟国家政府、区域合作、安全事务与外交互动，由东盟本地媒体报道。",
    keywords: [
      "asean",
      "southeast asia",
      "singapore",
      "indonesia",
      "malaysia",
      "thailand",
      "philippines",
      "vietnam",
      "myanmar",
      "cambodia",
      "laos",
      "south china sea",
      "jakarta",
      "manila",
      "bangkok",
      "kuala lumpur",
      "hanoi"
    ],
    excludeKeywords: ["tourism", "travel", "restaurant", "festival", "concert"],
    desiredCount: 4
  },
  {
    id: "hungary-election",
    label: REGION_LABELS["hungary-election"],
    description: "只关注匈牙利选举、竞选、投票安排、候选人、反对派与执政党动态。",
    keywords: [
      "hungary",
      "hungarian",
      "budapest",
      "orban",
      "orbán",
      "tisza",
      "election",
      "vote",
      "candidate",
      "campaign",
      "ballot",
      "opposition",
      "ruling party"
    ],
    excludeKeywords: ["tourism", "football", "culture", "festival"],
    desiredCount: 3
  }
];

export const BOARD_BY_ID: Record<RegionId, BoardDefinition> = Object.fromEntries(
  BOARD_DEFINITIONS.map((board) => [board.id, board])
) as Record<RegionId, BoardDefinition>;
