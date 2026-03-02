import React from 'react';
import { PriorityTag, type NewsItem } from '../types';
import { formatRelativeTime } from './newsService';

interface NewsCardProps {
  news: NewsItem;
}

// Hjelpefunksjon: Nå ber vi om større logoer (sz=128) for at de skal være skarpe!
const getSourceLogoUrl = (source: string) => {
  if (source.includes('Politiloggen') || source.includes('Politiet')) return 'https://www.google.com/s2/favicons?domain=politiet.no&sz=128';
  if (source.includes('Vegtrafikksentralen')) return 'https://www.google.com/s2/favicons?domain=vegvesen.no&sz=128';
  if (source.includes('Sarpsborg Kommune')) return 'https://upload.wikimedia.org/wikipedia/commons/4/43/Sarpsborg_komm.svg';
  if (source.includes('Sykehuset')) return 'https://www.google.com/s2/favicons?domain=sykehuset-ostfold.no&sz=128';
  if (source.includes('NRK')) return 'https://www.google.com/s2/favicons?domain=nrk.no&sz=128';
  if (source.includes('Varsom')) return 'https://www.google.com/s2/favicons?domain=varsom.no&sz=128';
  if (source.includes('Østfold Kollektivtrafikk')) return 'https://www.google.com/s2/favicons?domain=ostfold-kollektiv.no&sz=128';
  if (source.includes('Bane NOR')) return 'https://www.google.com/s2/favicons?domain=banenor.no&sz=128';
  if (source.includes('Tolletaten')) return 'https://www.google.com/s2/favicons?domain=toll.no&sz=128';
  if (source.includes('Østfold fylkeskommune') || source.includes('ØFK')) return 'https://commons.wikimedia.org/wiki/Category:%C3%98stfold#/media/File:%C3%98stfold_v%C3%A5pen.svg/2';
  
  return 'https://www.google.com/s2/favicons?domain=news.google.com&sz=128'; 
};

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
  const showPulse = isRed && isRecent;

  return (
    <a href={news.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      <div 
        className={`bg-gray-800 rounded-lg p-5 flex flex-col h-full relative hover:bg-gray-700 transition-colors duration-200 
          ${showPulse ? 'pulse-red-glow border border-red-500/50' : 'shadow-md'}
        `}
      >
        {/* Priority Tag (Top Right) */}
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white ${getPriorityTagClasses(
            news.priorityTag,
          )} flex items-center space-x-1`}
          aria-label={`Prioritet: ${getPriorityText(news.priorityTag)}`}
        >
          {news.priorityTag === PriorityTag.RED && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{getPriorityText(news.priorityTag)}</span>
        </span>

        {/* Hovedtopp: Logo til venstre, tekst til høyre */}
        <div className="flex items-start gap-4 mb-3 mt-1">
          
          {/* VENSTRE: Logo */}
          <div className="flex-shrink-0">
            <img 
              src={getSourceLogoUrl(news.source)} 
              alt={`${news.source} logo`} 
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-contain bg-white p-1.5 shadow-sm"
            />
          </div>

          {/* HØYRE: Tittel og Score */}
          <div className="flex flex-col flex-1">
            <h3 className="text-xl font-bold text-gray-100 mb-2 leading-tight pr-16">
              {news.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                {news.source}
              </span>
              
              {/* Gemini Score Tag */}
              <span
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200 cursor-help hover:bg-gray-600 transition-colors"
                aria-label={`Gemini score: ${news.geminiScore} av 10`}
                title={news.geminiReasoning ? `AI-begrunnelse: ${news.geminiReasoning}` : "Ingen begrunnelse oppgitt"}
              >
                <span className={`w-2 h-2 rounded-full ${getPriorityDotClasses(news.priorityTag)}`}></span>
                <span>Score: {news.geminiScore}/10</span>
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-base mb-4 flex-grow line-clamp-4">
          {news.description}
        </p>

        {/* Relative time */}
        <div className="flex items-center justify-end text-gray-400 text-xs mt-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatRelativeTime(news.timestamp)}</span>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;