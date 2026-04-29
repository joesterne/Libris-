import React from 'react';
import { Book, ReadingProgress } from '../../types';
import { CurrentlyReadingCard } from '../CurrentlyReadingCard';
import { RecommendationCard } from '../RecommendationCard';
import { GoalTracker } from '../GoalTracker';
import { CommunityPreviewCard } from '../CommunityPreviewCard';
import { ReadingStreakCard } from '../ReadingStreakCard';
import { BookCard } from '../BookCard';
import { Button } from '../ui/button';
import { BookOpen, Sparkles, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'motion/react';

interface HomePageProps {
  currentReading: ReadingProgress[];
  books: Record<string, Book>;
  recommendations: Book[];
  isRecommending: boolean;
  searchResults: Book[];
  feedbackGiven: Record<string, 'up' | 'down'>;
  completed: number;
  goal: number;
  activities: any[];
  onBookAction: (book: Book, status: 'reading' | 'wishlist' | 'completed') => void;
  onBookClick: (bookId: string) => void;
  onRecommendationFeedback: (book: Book, type: 'up' | 'down') => void;
  onViewCommunity: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentReading,
  books,
  recommendations,
  isRecommending,
  searchResults,
  feedbackGiven,
  completed,
  goal,
  activities,
  onBookAction,
  onBookClick,
  onRecommendationFeedback,
  onViewCommunity,
}) => {
  const SkeletonCards = ({ count }: { count: number }) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="aspect-[2/3] bg-black/5 rounded-2xl animate-pulse" />
          <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
        </div>
      ))}
    </>
  );

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-10"
    >
      <div className="lg:col-span-2 space-y-10">
        {/* Currently Reading */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Currently Reading
            </h3>
          </div>
          {currentReading.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {currentReading.map((p) => {
                const book = books[p.bookId];
                if (!book) return null;
                return (
                  <CurrentlyReadingCard
                    key={p.id}
                    progress={p}
                    book={book}
                    onClick={onBookClick}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white/50 border-2 border-dashed border-black/5 rounded-3xl p-12 text-center">
              <p className="text-muted-foreground font-medium">
                Not reading anything right now. Time to start a new adventure?
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={onViewCommunity}
              >
                Browse Books
              </Button>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Recommended for you
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {isRecommending ? (
              <SkeletonCards count={4} />
            ) : recommendations.length > 0 ? (
              recommendations.map((book) => (
                <RecommendationCard
                  key={book.id}
                  book={book}
                  feedbackGiven={feedbackGiven}
                  onAction={onBookAction}
                  onClick={onBookClick}
                  onFeedback={onRecommendationFeedback}
                />
              ))
            ) : searchResults.length > 0 ? (
              searchResults.slice(0, 4).map((book) => (
                <RecommendationCard
                  key={book.id}
                  book={book}
                  feedbackGiven={feedbackGiven}
                  onAction={onBookAction}
                  onClick={onBookClick}
                  onFeedback={onRecommendationFeedback}
                />
              ))
            ) : (
              <SkeletonCards count={4} />
            )}
          </div>
        </section>
      </div>

      <div className="space-y-10">
        <GoalTracker
          completed={completed}
          goal={goal}
          currentReading={currentReading.length}
        />
        <CommunityPreviewCard
          activities={activities}
          books={books}
          onViewFull={onViewCommunity}
        />
        <ReadingStreakCard />
      </div>
    </motion.div>
  );
};
