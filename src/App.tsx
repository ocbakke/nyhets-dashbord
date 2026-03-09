import './index.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PriorityTag, type NewsItem } from './types';
import { fetchNews, triggerScraping } from './components/newsService';
import { REFRESH_INTERVAL_MS } from './constants';
import NewsCard from './components/NewsCard';
import FilterControls from './components/FilterControls';

type NewsFilter = PriorityTag | 'ALL' | 'SISTE';

// Helper function for comprehensive sorting of news items
const sortNewsItems = (a: NewsItem, b: NewsItem): number => {
  // 1. Hovedsortering: AI-vurdering (Høyest score først, f.eks. 10 -> 1)
  if (b.geminiScore !== a.geminiScore) {
    return b.geminiScore - a.geminiScore;
  }
  
  // 2. Sekundærsortering: Tid (Nyeste sak først hvis scoren er helt lik)
  return b.timestamp.getTime() - a.timestamp.getTime();
};

function App() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<NewsFilter>('SISTE');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 1. Huskelapp for å unngå spam-varsler
  const notifiedNewsIds = useRef<Set<string>>(new Set());

  // 2. Funksjon for å be brukeren om tillatelse til varsler
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Nettleseren din støtter ikke skrivebordsvarsler.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("Varsler aktivert! 🚨", {
        body: "Du får nå et pling når det skjer noe med score 7 eller høyere.",
      });
    }
  };

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNews = await fetchNews();
      setNewsItems(fetchedNews);
      setLastUpdated(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // 3. --- VARSLINGSLOGIKKEN ---
      // Går gjennom alle de hentede sakene
      fetchedNews.forEach((article) => {
        // Sjekker om scoren er 7 eller mer, OG at vi ikke allerede har varslet om den
        if (article.geminiScore >= 7 && !notifiedNewsIds.current.has(article.id)) {
          
          if (Notification.permission === "granted") {
            const notification = new Notification(`🚨 Score: ${article.geminiScore}/10 - ${article.source}`, {
              body: article.title,
              requireInteraction: true 
            });

            notification.onclick = () => {
              window.focus(); 
              notification.close();
            };
          }

          // Legger saken i huskelappen så vi ikke varsler igjen ved neste oppdatering
          notifiedNewsIds.current.add(article.id);
        }
      });

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

    // Set up automatic refresh
    const intervalId = setInterval(loadNews, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadNews]);

  const handleRefresh = useCallback(async () => {
    setIsScraping(true);
    setError(null);
    try {
      await triggerScraping();
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

    let ageFilteredNews = newsItems.filter(news => news.timestamp.getTime() > threeDaysAgo.getTime());

    if (selectedSource !== 'ALL') {
      ageFilteredNews = ageFilteredNews.filter(news => news.source === selectedSource);
    }

    let result: NewsItem[] = [];

    if (selectedFilter === 'SISTE') {
      const sortedByTimestampForLatest = [...ageFilteredNews].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      result = sortedByTimestampForLatest.slice(0, 9);
      return result.sort(sortNewsItems);
    } else {
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
            
            {/* KNAPP FOR Å SKRU PÅ VARSLER (Alltid mørk) */}
            <button 
              onClick={requestNotificationPermission}
              className="bg-slate-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2 border border-slate-700 transition-colors hidden sm:flex"
              title="Få pushvarsel når viktige saker dukker opp"
            >
              🔔 Skru på varsler
            </button>

            {lastUpdated && (
              <span className="text-gray-500 font-medium text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sist: {lastUpdated}
              </span>
            )}
            
            {/* OPPDATER-KNAPP (Alltid mørk / sterk blå) */}
            <button
              onClick={handleRefresh}
              className={`flex items-center px-4 py-2 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${isScraping ? 'bg-slate-700 border border-slate-600' : 'bg-slate-900 hover:bg-black border border-slate-700'}
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