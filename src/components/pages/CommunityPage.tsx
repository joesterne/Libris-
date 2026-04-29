import React, { useState } from 'react';
import { Book } from '../../types';
import { ActivityCard } from '../ActivityCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Users, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CommunityPageProps {
  activities: any[];
  books: Record<string, Book>;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onBookClick: (bookId: string) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  activities,
  books,
  isLoadingMore,
  onLoadMore,
  onBookClick,
}) => {
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'reviews' | 'progress'
  >('all');

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'reviews') return act.type === 'review';
    if (activityFilter === 'progress') return act.type === 'progress';
    return true;
  });

  return (
    <motion.div
      key="community"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            Community Feed
          </h2>
          <p className="text-muted-foreground font-medium">
            See what other readers are discovering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={activityFilter}
            onValueChange={(v: any) => setActivityFilter(v)}
          >
            <TabsList className="bg-black/5 rounded-xl h-9">
              <TabsTrigger
                value="all"
                className="text-[10px] font-bold px-4"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="text-[10px] font-bold px-4"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="text-[10px] font-bold px-4"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge
            variant="secondary"
            className="bg-black text-white border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 h-9 flex items-center"
          >
            {activities.length} Recent
          </Badge>
        </div>
      </div>

      {filteredActivities.length > 0 ? (
        <>
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              book={books[activity.bookId]}
              onBookClick={onBookClick}
            />
          ))}

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              className="rounded-2xl px-10 h-12 font-bold bg-white border-2 border-black/5 hover:border-black transition-colors flex items-center gap-2"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {isLoadingMore ? 'Discovering...' : 'Load More Activity'}
            </Button>
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
          <p className="text-muted-foreground font-medium">
            No{' '}
            {activityFilter !== 'all' ? activityFilter : 'community'}{' '}
            activity yet. Be the first to share!
          </p>
        </div>
      )}
    </motion.div>
  );
};
