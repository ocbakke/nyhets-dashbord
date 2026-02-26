import './index.css';
import React, { useState, useEffect, useCallback, } from 'react';
import { PriorityTag, type NewsItem } from './types';
import { fetchNews, triggerScraping } from './components/newsService';
import { REFRESH_INTERVAL_MS } from './constants';
import NewsCard from './components/NewsCard';
import FilterControls from './components/FilterControls';

type NewsFilter = PriorityTag | 'ALL' | 'SISTE';

// Helper function for comprehensive sorting of news items
const sortNewsItems = (a: NewsItem, b: NewsItem): number => {
  // Primary sort: Priority Tag (RED > YELLOW > GREEN)
  const priorityOrder: Record<PriorityTag, number> = {
    [PriorityTag.RED]: 3,
    [PriorityTag.YELLOW]: 2,
    [PriorityTag.GREEN]: 1,
  };
  const priorityDiff = priorityOrder[b.priorityTag] - priorityOrder[a.priorityTag];
  if (priorityDiff !== 0) return priorityDiff;

  // Secondary sort: Gemini Score (highest first)
  const scoreDiff = b.geminiScore - a.geminiScore;
  if (scoreDiff !== 0) return scoreDiff;

  // Tertiary sort: Timestamp (newest first)
  return b.timestamp.getTime() - a.timestamp.getTime();
};

function App() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false); // New state for scraping
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<NewsFilter>('SISTE');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNews = await fetchNews();
      setNewsItems(fetchedNews);
      setLastUpdated(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`Kunne ikke hente nyheter: ${e.message}`);
      } else {
        setError('En ukjent feil oppstod ved henting av nyheter.');
      }
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(); // Initial load

    // Set up automatic refresh (Only reads from DB, does not trigger scrape automatically to save resources)
    const intervalId = setInterval(loadNews, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadNews]);

  // Updated handleRefresh to include Scraping
  const handleRefresh = useCallback(async () => {
    setIsScraping(true);
    setError(null);
    try {
      // 1. Trigger the backend scraper
      await triggerScraping();
      
      // 2. Load the newly populated data
      await loadNews();
    } catch (e: unknown) {
       if (e instanceof Error) {
        setError(`Feil ved oppdatering (sjekk at 'process-news' funksjonen kjører): ${e.message}`);
      } else {
        setError('En feil oppstod under skraping.');
      }
    } finally {
      setIsScraping(false);
    }
  }, [loadNews]);

  const handleSelectFilter = useCallback((filter: NewsFilter) => {
    setSelectedFilter(filter);
  }, []);

  const handleSourceChange = useCallback((source: string) => {
    setSelectedSource(source);
  }, []);

  const uniqueSources = React.useMemo(() => {
    const sources = new Set(newsItems.map(item => item.source));
    return Array.from(sources).sort();
  }, [newsItems]);

  const filteredNews = React.useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // 1. Filter out news older than 3 days.
    let ageFilteredNews = newsItems.filter(news => news.timestamp.getTime() > threeDaysAgo.getTime());

    // 2. Filter by Source if selected
    if (selectedSource !== 'ALL') {
      ageFilteredNews = ageFilteredNews.filter(news => news.source === selectedSource);
    }

    let result: NewsItem[] = [];

    if (selectedFilter === 'SISTE') {
      // For 'SISTE' tab:
      // 3. Get the 9 most recent items (chronologically from ageFilteredNews).
      const sortedByTimestampForLatest = [...ageFilteredNews].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      result = sortedByTimestampForLatest.slice(0, 9);
      
      // 4. Sort these 9 items by Importance (High to Low)
      return result.sort(sortNewsItems);
    } else {
      // For 'ALL' and specific priority filters:
      result = ageFilteredNews.filter(news => selectedFilter === 'ALL' || news.priorityTag === selectedFilter);
      return result.sort(sortNewsItems);
    }
  }, [newsItems, selectedFilter, selectedSource]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-50 p-6 sm:p-8 md:p-10">
      <header className="sticky top-0 bg-gray-900 z-10 -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10 pb-4 border-b border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div className="flex flex-col mb-4 sm:mb-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
              Nyhetsvarsel
            </h1>
            <p className="text-gray-400 text-sm mt-1">Sanntidsoppdateringer hvert minutt</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-gray-400 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sist: {lastUpdated}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className={`flex items-center px-4 py-2 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${isScraping ? 'bg-indigo-600' : 'bg-blue-600 hover:bg-blue-700'}
              `}
              disabled={loading || isScraping}
              aria-label="Oppdater nyheter"
            >
              {loading || isScraping ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              {isScraping ? 'Søker...' : (loading ? 'Laster...' : 'Oppdater')}
            </button>
          </div>
        </div>
        <FilterControls
          selectedFilter={selectedFilter}
          onSelectFilter={handleSelectFilter}
          sources={uniqueSources}
          selectedSource={selectedSource}
          onSelectSource={handleSourceChange}
        />
      </header>


      {error && (
        <div className="bg-red-800 text-white p-4 rounded-lg mb-6 shadow-md text-center" role="alert">
          <p className="font-bold">Feilmelding</p>
          <p>{error}</p>
        </div>
      )}

      {loading && newsItems.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20" role="status">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-4 text-xl text-gray-300 mt-4">Laster inn nyheter...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-xl" role="status" aria-live="polite">
          Ingen nyheter funnet {selectedFilter !== 'ALL' && `i kategorien '${selectedFilter}'`}. 
          {/* Hint to user if DB is empty */}
          {newsItems.length === 0 && (
             <p className="text-sm mt-4 text-gray-500">Databasen virker tom. Prøv å trykke "Oppdater" for å starte et søk (krever at backend er satt opp).</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;