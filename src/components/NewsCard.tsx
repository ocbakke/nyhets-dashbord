import React from 'react';
import { PriorityTag, type NewsItem } from '../types';
import { formatRelativeTime } from './newsService';

interface NewsCardProps {
  news: NewsItem;
}

interface ExpandableInfoPanelProps {
  title: string;
  content: string;
}

const ExpandableInfoPanel: React.FC<ExpandableInfoPanelProps> = ({ title, content }) => (
  <details className="group rounded-md bg-gray-900 border border-gray-700 p-3">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      <span>{title}</span>
      <span className="text-[11px] font-medium normal-case tracking-normal text-gray-500 group-open:hidden">
        Vis
      </span>
      <span className="hidden text-[11px] font-medium normal-case tracking-normal text-gray-500 group-open:inline">
        Skjul
      </span>
    </summary>
    <p className="mt-2 max-h-36 overflow-y-auto pr-1 text-gray-300 text-sm leading-relaxed">
      {content}
    </p>
  </details>
);

const getSourceLogoUrl = (source: string) => {
  const normalizedSource = source.toLocaleLowerCase('nb-NO');

  if (isStortingetSource(source)) return 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Stortinget_logo.svg';
  if (normalizedSource.includes('elvia') || normalizedSource.includes('strømbrudd') || normalizedSource.includes('strombrudd')) return 'https://www.google.com/s2/favicons?domain=elvia.no&sz=128';
  if (normalizedSource.includes('statsforvalteren') || normalizedSource.includes('kunngjøring') || normalizedSource.includes('kunngjoring')) return 'https://www.google.com/s2/favicons?domain=statsforvalteren.no&sz=128';
  if (source.includes('Politiloggen') || source.includes('Politiet')) return 'https://www.google.com/s2/favicons?domain=politiet.no&sz=128';
  if (source.includes('Vegtrafikksentralen')) return 'https://www.google.com/s2/favicons?domain=vegvesen.no&sz=128';
  if (source.includes('Sarpsborg Kommune')) return 'https://upload.wikimedia.org/wikipedia/commons/4/43/Sarpsborg_komm.svg';
  if (source.includes('Sykehuset')) return 'https://www.google.com/s2/favicons?domain=sykehuset-ostfold.no&sz=128';
  if (source.includes('NRK')) return 'https://www.google.com/s2/favicons?domain=nrk.no&sz=128';
  if (source.includes('Varsom')) return 'https://www.google.com/s2/favicons?domain=varsom.no&sz=128';
  if (source.includes('Østfold Kollektivtrafikk')) return 'https://www.google.com/s2/favicons?domain=ostfold-kollektiv.no&sz=128';
  if (source.includes('Bane NOR')) return 'https://www.google.com/s2/favicons?domain=banenor.no&sz=128';
  if (source.includes('Tolletaten')) return 'https://www.google.com/s2/favicons?domain=toll.no&sz=128';
  if (source.includes('Østfold fylkeskommune') || source.includes('ØFK')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a2/%C3%98stfold_v%C3%A5pen.svg';
  if (source.includes('HRS') || source.includes('Hovedredningssentralen')) return 'https://www.google.com/s2/favicons?domain=hovedredningssentralen.no&sz=128';
  if (source.includes('110') || source.includes('Brann')) return 'https://www.google.com/s2/favicons?domain=ost110.no&sz=128';
  
  return 'https://www.google.com/s2/favicons?domain=news.google.com&sz=128'; 
};

const getSafeExternalUrl = (value: string): string | null => {
  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const isStortingetSource = (source: string): boolean => (
  source.trim().toLocaleLowerCase('nb-NO').includes('stortinget')
);

const getUrlHost = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const formatPublishedAt = (date: Date): string => (
  date.toLocaleString('no-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
);

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const getPriorityTagClasses = (tag: PriorityTag): string => {
    switch (tag) {
      case PriorityTag.RED: return 'bg-red-700';
      case PriorityTag.YELLOW: return 'bg-yellow-600';
      case PriorityTag.GREEN: return 'bg-green-700';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityDotClasses = (tag: PriorityTag): string => {
    switch (tag) {
      case PriorityTag.RED: return 'bg-red-500';
      case PriorityTag.YELLOW: return 'bg-yellow-400';
      case PriorityTag.GREEN: return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityText = (tag: PriorityTag): string => {
    switch (tag) {
      case PriorityTag.RED: return 'Høy';
      case PriorityTag.YELLOW: return 'Medium';
      case PriorityTag.GREEN: return 'Lav';
      default: return 'Ukjent';
    }
  };

  const isRed = news.priorityTag === PriorityTag.RED;
  const now = new Date();
  const timeDiffMs = now.getTime() - news.timestamp.getTime();
  const fiveMinMs = 5 * 60 * 1000;
  const isRecent = timeDiffMs < fiveMinMs;
  
  const triggerAlarm = isRed && isRecent;

  const isStortinget = isStortingetSource(news.source);
  const aiSummary = news.ai_summary?.trim() || '';
  const description = news.description?.trim() || '';
  const displaySummary = aiSummary || description;
  const safeArticleUrl = getSafeExternalUrl(news.url);
  const sourceHost = getUrlHost(safeArticleUrl || news.url);
  const showExpandableDescription = Boolean(description);
  const publishedAt = formatPublishedAt(news.timestamp);
  const sourceLinkLabel = isStortinget ? 'Åpne hos Stortinget' : 'Kilde / Les saken';

  return (
    <div className="block h-full">
      <div 
        className={`bg-gray-800 rounded-lg p-5 flex flex-col h-full relative hover:bg-gray-750 transition-colors duration-200 
          ${triggerAlarm ? 'flash-alarm border border-red-500' : 'shadow-md border border-gray-700'}
        `}
      >
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white ${getPriorityTagClasses(
            news.priorityTag,
          )} flex items-center space-x-1 shadow-sm z-10`}
          aria-label={`Prioritet: ${getPriorityText(news.priorityTag)}`}
        >
          {news.priorityTag === PriorityTag.RED && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{getPriorityText(news.priorityTag)}</span>
        </span>

        <div className="flex items-start gap-4 mb-3 mt-1">
          <div className="flex-shrink-0">
            <img 
              src={getSourceLogoUrl(news.source)}
              alt={`${news.source} logo`}
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-contain bg-white p-1.5 shadow-sm"
            />
          </div>

          <div className="flex flex-col flex-1">
            <h3 className="text-xl font-bold text-gray-100 mb-2 leading-tight pr-16">
              {news.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                {news.source}
              </span>

              <span
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200 cursor-help hover:bg-gray-600 transition-colors"
                title={news.geminiReasoning ? `AI-begrunnelse: ${news.geminiReasoning}` : "Ingen begrunnelse oppgitt"}
              >
                <span className={`w-2 h-2 rounded-full ${getPriorityDotClasses(news.priorityTag)}`}></span>
                <span>Score: {news.geminiScore}/10</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex-grow space-y-4">
          {(showExpandableDescription || news.geminiReasoning) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showExpandableDescription && (
                <ExpandableInfoPanel title="Beskrivelse" content={description} />
              )}

              {news.geminiReasoning && (
                <ExpandableInfoPanel title="AI-begrunnelse" content={news.geminiReasoning} />
              )}
            </div>
          )}

          {displaySummary && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                {aiSummary ? 'AI-sammendrag' : 'Beskrivelse'}
              </p>
              <p className="text-gray-200 text-base line-clamp-4 leading-relaxed">
                {displaySummary}
              </p>
            </section>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col gap-4">
          
          <div className="flex items-center justify-end text-gray-400 text-xs" title={`Publisert: ${publishedAt}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatRelativeTime(news.timestamp)} · {publishedAt}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {safeArticleUrl ? (
              <a 
                href={safeArticleUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                title={safeArticleUrl}
              >
                {sourceLinkLabel}
                {sourceHost && (
                  <span className="block text-[11px] font-normal text-gray-300 truncate">
                    {sourceHost}
                  </span>
                )}
              </a>
            ) : (
              <span
                className="flex-1 text-center bg-gray-800 text-gray-500 py-2 px-3 rounded-lg text-sm font-medium border border-gray-700 cursor-not-allowed"
                aria-disabled="true"
                title="Ugyldig eller utrygg lenke"
              >
                Kilde utilgjengelig
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
