import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { ReadingProgress, Review, RecommendationFeedback } from '../types';

export function useFirestoreData(
  user: FirebaseUser | null,
  fetchBookIfNeeded: (bookId: string) => void
) {
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState<RecommendationFeedback[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [commLimit, setCommLimit] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reading_progress'),
      where('uid', '==', user.uid)
    );
    const unsubscribeProgress = onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ReadingProgress)
      );
      setReadingProgress(progress);
      progress.forEach((p) => fetchBookIfNeeded(p.bookId));
    });

    const qReviews = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(commLimit)
    );
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      const revs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data(), type: 'review' } as any)
      );
      setReviews(revs);
      revs.forEach((r: any) => fetchBookIfNeeded(r.bookId));
    });

    const qGlobal = query(
      collection(db, 'reading_progress'),
      orderBy('updatedAt', 'desc'),
      limit(commLimit)
    );
    const unsubscribeGlobalProgress = onSnapshot(qGlobal, (snapshot) => {
      const progress = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data(), type: 'progress' } as any)
      );
      setGlobalActivities(progress);
      progress.forEach((p: any) => fetchBookIfNeeded(p.bookId));
    });

    const unsubscribeFeedback = onSnapshot(
      query(
        collection(db, 'recommendation_feedback'),
        where('uid', '==', user.uid)
      ),
      (snapshot) => {
        const fb = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as RecommendationFeedback)
        );
        setRecommendationFeedback(fb);
        const fbMap: Record<string, 'up' | 'down'> = {};
        fb.forEach((f) => (fbMap[f.bookId] = f.type));
        setFeedbackGiven((prev) => ({ ...prev, ...fbMap }));
      }
    );

    return () => {
      unsubscribeProgress();
      unsubscribeReviews();
      unsubscribeGlobalProgress();
      unsubscribeFeedback();
    };
  }, [user, commLimit, fetchBookIfNeeded]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setCommLimit((prev) => prev + 5);
    setTimeout(() => setIsLoadingMore(false), 800);
  }, []);

  return {
    readingProgress,
    reviews,
    globalActivities,
    recommendationFeedback,
    feedbackGiven,
    setFeedbackGiven,
    isLoadingMore,
    handleLoadMore,
  };
}
