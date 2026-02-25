import { PriorityTag, type NewsSource } from './types';

export const NEWS_SOURCES: NewsSource[] = [
  { name: 'Politiloggen Øst', url: 'https://www.politiet.no/politiloggen?distrikt=ost' },
  { name: 'Sarpsborg kommune', url: 'https://sarpsborg.com/aktuelt' },
  { name: 'Østfold fylkeskommune', url: 'https://ofk.no/aktuelt/' },
  { name: 'Sykehuset Østfold', url: 'https://www.sykehuset-ostfold.no/#nyheter' },
  { name: 'NRK Østfold RSS', url: 'https://www.nrk.no/ostfold/siste.rss' },
];

export const PRIORITY_THRESHOLDS = {
  RED: { min: 8, max: 10, tag: PriorityTag.RED },
  YELLOW: { min: 4, max: 7, tag: PriorityTag.YELLOW },
  GREEN: { min: 1, max: 3, tag: PriorityTag.GREEN },
};

export const REFRESH_INTERVAL_MS = 60000;