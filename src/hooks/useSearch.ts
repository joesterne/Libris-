import { useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { searchBooks } from '../lib/googleBooks';
import { toast } from 'sonner';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await searchBooks(searchQuery);
        setSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error('Suggestions fetch failed', error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
        const results = await searchBooks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        toast.error('Failed to search books');
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  const selectSuggestion = useCallback((book: Book) => {
    setSearchQuery(book.title);
    setSearchResults([book]);
    setShowSuggestions(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    isSearching,
    handleSearch,
    selectSuggestion,
  };
}
