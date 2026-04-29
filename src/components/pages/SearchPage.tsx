import React from 'react';
import { Book } from '../../types';
import { BookCard } from '../BookCard';
import { Button } from '../ui/button';
import { Search, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchPageProps {
  isSearching: boolean;
  searchResults: Book[];
  onBookAction: (book: Book, status: 'reading' | 'wishlist' | 'completed') => void;
  onBookClick: (bookId: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  isSearching,
  searchResults,
  onBookAction,
  onBookClick,
}) => {
  return (
    <motion.div
      key="search"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {isSearching ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[2/3] bg-black/5 rounded-2xl animate-pulse" />
              <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {searchResults.map((book) => (
            <div key={book.id} className="space-y-3">
              <BookCard
                book={book}
                onAction={onBookAction}
                onClick={onBookClick}
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 bg-white shadow-sm hover:bg-black hover:text-white transition-all"
                onClick={() => onBookAction(book, 'wishlist')}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add to Wishlist
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">Search for your next book</h3>
          <p className="text-muted-foreground">
            Enter a title, author, or topic to explore millions of books.
          </p>
        </div>
      )}
    </motion.div>
  );
};
