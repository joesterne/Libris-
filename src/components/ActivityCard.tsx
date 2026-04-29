import React from 'react';
import { Book } from '../types';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Star } from 'lucide-react';

interface ActivityCardProps {
  activity: any;
  book: Book | undefined;
  onBookClick: (bookId: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  book,
  onBookClick,
}) => {
  const isReview = activity.type === 'review';

  const handleKeyDown = (e: React.KeyboardEvent, bookId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onBookClick(bookId);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="w-10 h-10 border-2 border-black/5">
            <AvatarImage
              src={activity.userPhotoURL || activity.photoURL || ''}
            />
            <AvatarFallback>
              {(activity.userDisplayName || 'R')[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {activity.userDisplayName || 'A Reader'}
              </span>
              <span className="text-xs text-muted-foreground">
                {isReview
                  ? 'reviewed'
                  : activity.status === 'completed'
                    ? 'finished reading'
                    : 'started reading'}
              </span>
              <span
                className="font-bold text-sm cursor-pointer hover:underline focus-visible:ring-2 focus-visible:ring-black outline-none rounded-sm"
                onClick={() => onBookClick(activity.bookId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, activity.bookId)}
                aria-label={`View details for ${book?.title}`}
              >
                {book?.title || 'a book'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
              {activity.createdAt?.toDate?.().toLocaleDateString() ||
                activity.updatedAt?.toDate?.().toLocaleDateString() ||
                'Recently'}
            </p>
          </div>
        </div>

        <div className="flex gap-6 bg-black/[0.02] p-4 rounded-2xl">
          <div
            className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-black outline-none"
            onClick={() => onBookClick(activity.bookId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, activity.bookId)}
            aria-label={`View cover for ${book?.title}`}
          >
            <img
              src={
                book?.coverUrl ||
                `https://picsum.photos/seed/${activity.bookId}/200/300`
              }
              alt={`Cover of ${book?.title}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 space-y-3">
            {isReview ? (
              <>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < activity.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{activity.review}"
                </p>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {activity.status === 'completed'
                    ? 'Completed this journey! 🎉'
                    : `Currently on page ${activity.currentPage} of ${activity.totalPages}`}
                </p>
                {activity.status === 'reading' && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>
                        {Math.round(
                          (activity.currentPage / activity.totalPages) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (activity.currentPage / activity.totalPages) * 100
                      }
                      className="h-1.5"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
