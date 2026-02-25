export enum PriorityTag {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: Date;
  url: string;
  description: string; // Added description field
  geminiScore: number;
  geminiReasoning: string;
  priorityTag: PriorityTag;
}

export interface NewsSource {
  name: string;
  url: string;
}