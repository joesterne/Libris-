import React from 'react';
import { Book } from '../../types';
import { PAGE_TITLES, PAGE_SUBTITLES } from '../../lib/constants';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activeTab: string;
  selectedBookId: string | null;
  searchQuery: string;
  suggestions: Book[];
  showSuggestions: boolean;
  onSearchQueryChange: (value: string) => void;
  onShowSuggestions: (show: boolean) => void;
  onSearch: (e: React.FormEvent) => void;
  onSelectSuggestion: (book: Book) => void;
  onSetActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  selectedBookId,
  searchQuery,
  suggestions,
  showSuggestions,
  onSearchQueryChange,
  onShowSuggestions,
  onSearch,
  onSelectSuggestion,
  onSetActiveTab,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
      <div>
        <h2 className="text-4xl font-black tracking-tighter uppercase">
          {selectedBookId
            ? 'Book Details'
            : PAGE_TITLES[activeTab] || 'Welcome back'}
        </h2>
        <p className="text-muted-foreground font-medium">
          {selectedBookId
            ? 'Explore more about this title.'
            : PAGE_SUBTITLES[activeTab] || ''}
        </p>
      </div>

      <div className="relative w-full md:w-96 group">
        <form onSubmit={onSearch}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-black transition-colors" />
          <Input
            placeholder="Search by title, author, or genre..."
            className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-black"
            value={searchQuery}
            onChange={(e) => {
              onSearchQueryChange(e.target.value);
              onShowSuggestions(true);
            }}
            onFocus={() => onShowSuggestions(true)}
          />
        </form>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden z-[60]"
            >
              <ScrollArea className="max-h-[300px]">
                {suggestions.map((book) => (
                  <button
                    key={book.id}
                    className="w-full p-4 flex gap-4 hover:bg-black/5 transition-colors text-left border-b border-black/5 last:border-none"
                    onClick={() => {
                      onSelectSuggestion(book);
                      onSetActiveTab('search');
                    }}
                  >
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="w-10 h-14 object-cover rounded shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-sm font-bold line-clamp-1">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">
                        {book.authors.join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {showSuggestions && (
          <div
            className="fixed inset-0 z-[55]"
            onClick={() => onShowSuggestions(false)}
          />
        )}
      </div>
    </header>
  );
};
