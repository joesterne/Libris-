import React from 'react';
import { Book, ReadingProgress } from '../types';
import { LibbyBadge } from './LibbyBadge';
import { Progress } from './ui/progress';

interface CurrentlyReadingCardProps {
  progress: ReadingProgress;
  book: Book;
  onClick: (bookId: string) => void;
}

export const CurrentlyReadingCard: React.FC<CurrentlyReadingCardProps> = ({
  progress,
  book,
  onClick,
}) => {
  const percentage = Math.round(
    (progress.currentPage / progress.totalPages) * 100
  );

  return (
    <div
      className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 items-center relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-black outline-none"
      onClick={() => onClick(book.id)}
      role="button"
      tabIndex={0}
      aria-label={`View progress for ${book.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(book.id);
        }
      }}
    >
      <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md">
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <p className="text-sm font-bold line-clamp-1">{book.title}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">
              {book.authors[0]}
            </p>
          </div>
          <LibbyBadge bookId={book.id} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span>{percentage}%</span>
            <span>
              {progress.currentPage}/{progress.totalPages} pages
            </span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>
      </div>
    </div>
  );
};
