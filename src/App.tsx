import './index.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PriorityTag, type NewsItem } from './types';
import { fetchNews } from './components/newsService'; // Fjernet triggerScraping herfra
import { REFRESH_INTERVAL_MS } from './constants';
import NewsCard from './components/NewsCard';
import FilterControls from './components/FilterControls';

type NewsFilter = PriorityTag | 'ALL' | 'SISTE';

// Hjelpefunksjon for sortering (Høyest score først, så nyest)
const sortNewsItems = (a: NewsItem, b: NewsItem): number => {
  if (b.geminiScore !== a.geminiScore) {
    return b.geminiScore - a.geminiScore;
  }
  return b.timestamp.getTime() - a.timestamp.getTime();
};

function App() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Fjernet isScraping-state siden knappen er borte
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<NewsFilter>('SISTE');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const notifiedNewsIds = useRef<Set<string>>(new Set());

  // Funksjon for varsler (Apple-sikret)
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification) {
      try {
        const permission = await window.Notification.requestPermission();
        if (permission === "granted") {
          new window.Notification("Varsler aktivert! 🚨", {
            body: "Du får nå et pling når det skjer noe med score 7 eller høyere.",
          });
        }
      } catch (e) {
        console.error("Feil ved aktivering av varsler:", e);
      }
    } else {
      alert("Nettleseren din støtter ikke skrivebordsvarsler.");
    }
  };

  // Funksjon for å hente nyheter fra databasen
  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNews = await fetchNews();
      setNewsItems(fetchedNews);
      setLastUpdated(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Varslingslogikk (Apple-sikret)
      fetchedNews.forEach((article) => {
        if (article.geminiScore >= 7 && !notifiedNewsIds.current.has(article.id)) {
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === "granted") {
            const notification = new window.Notification(`🚨 Score: ${article.geminiScore}/10 - ${article.source}`, {
              body: article.title,
              requireInteraction: true 
            });
            notification.onclick = () => {
              window.focus(); 
              notification.close();
            };
          }
          notifiedNewsIds.current.add(article.id);
        }
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`Kunne ikke hente nyheter: ${e.message}`);
      } else {
        setError('En ukjent feil oppstod.');
      }
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(); // Initial load
    const intervalId = setInterval(loadNews, REFRESH_INTERVAL_MS); // Auto-refresh
    return () => clearInterval(intervalId);
  }, [loadNews]);

  // handleRefresh-funksjonen er slettet herfra

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
    // LØSNING LYS-MODUS: La til 'dark' klasse her for å tvinge mørkt tema overalt
    <div className="dark min-h-screen bg-gray-900 text-gray-50 p-6 sm:p-8 md:p-10">
      <header className="sticky top-0 bg-gray-900 z-10 -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10 pb-4 border-b border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div className="flex flex-col mb-4 sm:mb-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
              SA-NYHETSDASHBOARD
            </h1>
            <p className="text-gray-400 text-sm mt-1">Automatisk oppdatering fra skyen</p>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* LØSNING LYS-MODUS: Sikret at knappen er mørk og teksten hvit uansett modus */}
            <button 
              onClick= {requestNotificationPermission}
              className="bg-gray-950 hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 border border-gray-700 transition-colors hidden sm:flex"
              title="Få pushvarsel når viktige saker dukker opp"
            >
              <span className="text-base">🔔</span> Skru på varsler
            </button>

            {lastUpdated && (
              <span className="text-gray-400 font-medium text-sm flex items-center bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sist oppdatert: {lastUpdated}
              </span>
            )}
            
            {/* HER LÅ OPPDATER-KNAPPEN. DEN ER NÅ SLETTET. 🎉 */}
            
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
        <div className="bg-red-900 text-white p-4 rounded-lg mb-6 shadow-md text-center border border-red-700" role="alert">
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
          <p className="ml-4 text-xl text-gray-300 mt-4">Henter siste nytt...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-xl" role="status">
          Ingen nyheter funnet {selectedFilter !== 'ALL' && `i kategorien '${selectedFilter}'`}. 
          {newsItems.length === 0 && (
             <p className="text-sm mt-4 text-gray-500">Databasen virker tom. Skraperen jobber i bakgrunnen, vent litt.</p>
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
