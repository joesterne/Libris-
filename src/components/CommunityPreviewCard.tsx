import React from 'react';
import { Book } from '../types';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Users } from 'lucide-react';

interface CommunityPreviewCardProps {
  activities: any[];
  books: Record<string, Book>;
  onViewFull: () => void;
}

export const CommunityPreviewCard: React.FC<CommunityPreviewCardProps> = ({
  activities,
  books,
  onViewFull,
}) => {
  return (
    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4" />
          Community
        </h4>
        {activities.slice(0, 3).map((act: any) => (
          <div
            key={act.id}
            className="flex items-center gap-3 py-2 border-b border-black/5 last:border-none"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={act.userPhotoURL || act.photoURL} />
              <AvatarFallback>
                {(act.userDisplayName || 'R')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate">
                {act.userDisplayName || 'Reader'}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {act.type === 'review' ? 'Reviewed' : 'Read'}{' '}
                {books[act.bookId]?.title}
              </p>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          className="w-full text-[10px] font-bold uppercase tracking-widest h-8"
          onClick={onViewFull}
        >
          View Full Feed
        </Button>
      </CardContent>
    </Card>
  );
};
