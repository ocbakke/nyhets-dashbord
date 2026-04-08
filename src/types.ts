// Vi bruker et objekt i stedet for 'enum' for å tilfredsstille de nyeste reglene
export const PriorityTag = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
} as const;

// Dette lager "typen" PriorityTag ut ifra objektet over
export type PriorityTag = (typeof PriorityTag)[keyof typeof PriorityTag];

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: Date;
  url: string;
  description: string;
  geminiScore: number;
  geminiReasoning: string;
  priorityTag: PriorityTag;
  ai_summary?: string; // <-- HER ER DEN NYE STJERNESPILLEREN VÅR! ✨
}

export interface NewsSource {
  name: string;
  url: string;
}