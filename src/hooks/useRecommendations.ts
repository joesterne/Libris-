import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, ReadingProgress, RecommendationFeedback } from '../types';
import { getBookRecommendations } from '../lib/gemini';
import { searchBooks } from '../lib/googleBooks';
import { toast } from 'sonner';

export function useRecommendations(
  user: FirebaseUser | null,
  readingProgress: ReadingProgress[],
  books: Record<string, Book>,
  recommendationFeedback: RecommendationFeedback[],
  feedbackGiven: Record<string, 'up' | 'down'>,
  setFeedbackGiven: React.Dispatch<React.SetStateAction<Record<string, 'up' | 'down'>>>
) {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user || readingProgress.length === 0 || recommendations.length > 0)
        return;

      setIsRecommending(true);
      try {
        const historyTitles = readingProgress
          .map((p) => books[p.bookId]?.title)
          .filter(Boolean);
        const currentTitles = readingProgress
          .filter((p) => p.status === 'reading')
          .map((p) => books[p.bookId]?.title)
          .filter(Boolean);
        const liked = recommendationFeedback
          .filter((f) => f.type === 'up')
          .map((f) => f.bookTitle);
        const disliked = recommendationFeedback
          .filter((f) => f.type === 'down')
          .map((f) => f.bookTitle);

        const recs = await getBookRecommendations(
          historyTitles as string[],
          currentTitles as string[],
          liked,
          disliked
        );

        const fullRecs = await Promise.all(
          recs.map(async (r: any) => {
            const search = await searchBooks(r.searchQuery || r.title);
            return search[0];
          })
        );

        setRecommendations(fullRecs.filter(Boolean));
      } catch (error) {
        console.error('Failed to get recommendations', error);
      } finally {
        setIsRecommending(false);
      }
    };

    fetchRecs();
  }, [user, readingProgress, books]);

  const handleRecommendationFeedback = useCallback(
    async (book: Book, type: 'up' | 'down') => {
      if (!user) return;
      try {
        await addDoc(collection(db, 'recommendation_feedback'), {
          uid: user.uid,
          bookId: book.id,
          bookTitle: book.title,
          type,
          createdAt: serverTimestamp(),
        });
        setFeedbackGiven((prev) => ({ ...prev, [book.id]: type }));
        toast.success(
          type === 'up'
            ? "Glad you like this! We'll find more like it."
            : "Thanks for the feedback. We'll adjust your future recommendations."
        );
      } catch (error) {
        toast.error('Failed to save feedback');
      }
    },
    [user, setFeedbackGiven]
  );

  return {
    recommendations,
    isRecommending,
    handleRecommendationFeedback,
  };
}
