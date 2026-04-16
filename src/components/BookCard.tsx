import React from 'react';
import { Book, LibraryAvailability } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen, Clock, CheckCircle2, Library, Plus } from 'lucide-react';
import { checkLibbyAvailability } from '../lib/googleBooks';

interface BookCardProps {
  book: Book;
  onAction?: (book: Book, action: 'reading' | 'wishlist' | 'completed') => void;
  onClick?: (bookId: string) => void;
  showAvailability?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onAction, onClick, showAvailability = true }) => {
  const [availability, setAvailability] = React.useState<LibraryAvailability | null>(null);

  React.useEffect(() => {
    if (showAvailability) {
      checkLibbyAvailability(book.id).then(setAvailability);
    }
  }, [book.id, showAvailability]);

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
        {availability && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant={availability.status === 'available' ? 'default' : 'secondary'} 
              className="bg-white/90 text-black backdrop-blur-sm border-none shadow-sm"
              aria-label={`Libby status: ${availability.status === 'available' ? 'Available' : availability.status === 'waitlist' ? `${availability.estimatedWaitWeeks} weeks wait` : 'Unavailable'}`}
            >
              <Library className="w-3 h-3 mr-1" aria-hidden="true" />
              {availability.status === 'available' ? 'Available' : availability.status === 'waitlist' ? `${availability.estimatedWaitWeeks}w wait` : 'Unavailable'}
            </Badge>
          </div>
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
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full h-8 text-[10px] uppercase tracking-wider font-bold bg-black/5 hover:bg-black hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onAction?.(book, 'completed');
          }}
          aria-label={`Mark ${book.title} as completed`}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
          Mark as Read
        </Button>
      </CardFooter>
    </Card>
  );
};
