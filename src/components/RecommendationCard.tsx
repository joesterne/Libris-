import React from 'react';
import { Book } from '../types';
import { BookCard } from './BookCard';
import { Button } from './ui/button';
import { Plus, ThumbsUp, ThumbsDown } from 'lucide-react';

interface RecommendationCardProps {
  book: Book;
  feedbackGiven: Record<string, 'up' | 'down'>;
  onAction: (book: Book, status: 'reading' | 'wishlist' | 'completed') => void;
  onClick: (bookId: string) => void;
  onFeedback: (book: Book, type: 'up' | 'down') => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  book,
  feedbackGiven,
  onAction,
  onClick,
  onFeedback,
}) => {
  return (
    <div className="space-y-3 group relative">
      <BookCard book={book} onAction={onAction} onClick={onClick} />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 bg-white shadow-sm hover:bg-black hover:text-white transition-all"
          onClick={() => onAction(book, 'wishlist')}
        >
          <Plus className="w-3 h-3 mr-2" />
          Wishlist
        </Button>
        <div className="flex gap-1">
          <Button
            variant={feedbackGiven[book.id] === 'up' ? 'default' : 'secondary'}
            size="icon"
            className={`h-8 w-8 rounded-xl transition-all ${
              feedbackGiven[book.id] === 'up'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white hover:bg-black/5'
            }`}
            onClick={() => onFeedback(book, 'up')}
            disabled={!!feedbackGiven[book.id]}
            aria-label="Thumbs Up"
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button
            variant={
              feedbackGiven[book.id] === 'down' ? 'default' : 'secondary'
            }
            size="icon"
            className={`h-8 w-8 rounded-xl transition-all ${
              feedbackGiven[book.id] === 'down'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white hover:bg-black/5'
            }`}
            onClick={() => onFeedback(book, 'down')}
            disabled={!!feedbackGiven[book.id]}
            aria-label="Thumbs Down"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
