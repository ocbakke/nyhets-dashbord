import { supabase } from '../services/supabaseClient';
import { PriorityTag, type NewsItem } from '../types';

// Helper to format relative time (Kept from original file as it's used in UI)
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `omlag ${seconds} sekunder siden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `omlag ${minutes} minutter siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `omlag ${hours} timer siden`;
  const days = Math.floor(hours / 24);
  return `omlag ${days} dager siden`;
};

/**
 * Triggers the remote scraping process via Supabase Edge Functions.
 */
export const triggerScraping = async (): Promise<void> => {
  console.log('Triggering scraping via Supabase Edge Function...');
  
  // This invokes the function named 'process-news' on your Supabase project.
  const { data, error } = await supabase.functions.invoke('process-news');

  if (error) {
    console.error('Scraping trigger failed:', error);
    throw new Error(`Klarte ikke starte skraping: ${error.message}`);
  }
  
  console.log('Scraping completed successfully:', data);
};

/**
 * Fetches news items from the Supabase 'news_items' table.
 */
export const fetchNews = async (): Promise<NewsItem[]> => {
  console.log('Fetching news from Supabase...');
  
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  // Map Supabase (snake_case) fields to App (camelCase) interfaces
  return data.map((item: any) => ({
    id: item.id?.toString() || Math.random().toString(), // Ensure ID is a string
    title: item.title,
    source: item.source,
    // Convert database timestamp string to JS Date object
    timestamp: new Date(item.published_at), 
    url: item.url || '#', // Fallback if URL is missing
    description: item.description || '', // Fallback if description is missing
    geminiScore: item.gemini_score ?? 0, // Default to 0 if null
    geminiReasoning: item.gemini_reasoning || 'Ingen begrunnelse tilgjengelig.',
    priorityTag: (item.priority_tag as PriorityTag) || PriorityTag.GREEN, // Default to GREEN if null/invalid
  }));
};