import React from 'react';
import { Book } from '../../types';
import { RATING_LABELS } from '../../lib/constants';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Star } from 'lucide-react';

interface ReviewDialogProps {
  book: Book | null;
  rating: number;
  reviewText: string;
  isSubmitting: boolean;
  onRatingChange: (rating: number) => void;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  book,
  rating,
  reviewText,
  isSubmitting,
  onRatingChange,
  onTextChange,
  onSubmit,
  onClose,
}) => {
  return (
    <Dialog open={!!book} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            How was it?
          </DialogTitle>
          <DialogDescription>
            Share your thoughts on "{book?.title}" with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRatingChange(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {RATING_LABELS[rating]}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
              Your Review
            </Label>
            <Textarea
              placeholder="What did you think about the story, characters, or writing style?"
              className="rounded-2xl bg-black/5 border-none min-h-[120px] focus-visible:ring-black"
              value={reviewText}
              onChange={(e) => onTextChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl"
          >
            Skip
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-xl h-12 font-bold text-lg"
          >
            Post Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
