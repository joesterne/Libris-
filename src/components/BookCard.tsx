import React from 'react';
import { Book } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, CheckCircle2, Plus, ListPlus } from 'lucide-react';
import { LibbyBadge } from './LibbyBadge';

interface BookCardProps {
  book: Book;
  onAction?: (book: Book, action: 'reading' | 'wishlist' | 'completed' | 'reading_list') => void;
  onClick?: (bookId: string) => void;
  showAvailability?: boolean;
}

export const BookCard = React.memo(function BookCardComponent({ book, onAction, onClick, showAvailability = true }: BookCardProps) {
  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-white/50 backdrop-blur-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-black outline-none" 
      onClick={() => onClick?.(book.id)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${book.title} by ${book.authors.join(', ')}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(book.id);
        }
      }}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img 
          src={book.coverUrl} 
          alt={`Cover of ${book.title}`} 
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {showAvailability && (
          <LibbyBadge bookId={book.id} className="absolute top-2 right-2 backdrop-blur-sm shadow-sm" />
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold line-clamp-1">{book.title}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.authors.join(', ')}</p>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(book, 'reading');
            }}
            aria-label={`Start reading ${book.title}`}
          >
            <BookOpen className="w-3 h-3 mr-1" aria-hidden="true" />
            Read
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(book, 'wishlist');
            }}
            aria-label={`Add ${book.title} to your library`}
          >
            <Plus className="w-3 h-3 mr-1" aria-hidden="true" />
            Library
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold bg-black/5 hover:bg-black hover:text-white transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(book, 'reading_list');
            }}
            aria-label={`Add ${book.title} to reading list`}
          >
            <ListPlus className="w-3 h-3 mr-1" aria-hidden="true" />
            Reading List
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold bg-black/5 hover:bg-black hover:text-white transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(book, 'completed');
            }}
            aria-label={`Mark ${book.title} as completed`}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
            Completed
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
