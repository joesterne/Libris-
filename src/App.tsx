import React, { useState, useEffect, useCallback } from 'react';
import {
  addDoc,
  updateDoc,
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db, signInWithGoogle } from './firebase';
import { Book, LibraryAvailability } from './types';
import { checkLibbyAvailability } from './lib/googleBooks';
import { TabId } from './lib/constants';
import { useAuth } from './hooks/useAuth';
import { useBookCache } from './hooks/useBookCache';
import { useFirestoreData } from './hooks/useFirestoreData';
import { useSearch } from './hooks/useSearch';
import { useRecommendations } from './hooks/useRecommendations';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ReviewDialog } from './components/dialogs/ReviewDialog';
import { BookDetailView } from './components/BookDetailView';
import { HomePage } from './components/pages/HomePage';
import { SearchPage } from './components/pages/SearchPage';
import { LibraryPage } from './components/pages/LibraryPage';
import { AiPage } from './components/pages/AiPage';
import { CommunityPage } from './components/pages/CommunityPage';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Hooks ---
  const { user, profile, loading, updateGoal } = useAuth();
  const { books, fetchBookIfNeeded, cacheBook } = useBookCache();
  const {
    readingProgress,
    reviews,
    globalActivities,
    recommendationFeedback,
    feedbackGiven,
    setFeedbackGiven,
    isLoadingMore,
    handleLoadMore,
  } = useFirestoreData(user, fetchBookIfNeeded);
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    isSearching,
    handleSearch,
    selectSuggestion,
  } = useSearch();
  const {
    recommendations,
    isRecommending,
    handleRecommendationFeedback,
  } = useRecommendations(
    user,
    readingProgress,
    books,
    recommendationFeedback,
    feedbackGiven,
    setFeedbackGiven
  );

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [libbyAvailability, setLibbyAvailability] =
    useState<LibraryAvailability | null>(null);
  const [isCheckingLibby, setIsCheckingLibby] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'date'>('date');

  // Review dialog state
  const [reviewBook, setReviewBook] = useState<Book | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // --- Libby Availability ---
  useEffect(() => {
    if (!selectedBookId) {
      setLibbyAvailability(null);
      return;
    }
    const check = async () => {
      setIsCheckingLibby(true);
      try {
        const result = await checkLibbyAvailability(selectedBookId);
        setLibbyAvailability(result);
      } catch (error) {
        console.error('Libby check failed', error);
      } finally {
        setIsCheckingLibby(false);
      }
    };
    check();
  }, [selectedBookId]);

  // --- Derived Data ---
  const currentReading = readingProgress.filter((p) => p.status === 'reading');
  const completed = readingProgress.filter(
    (p) => p.status === 'completed'
  ).length;

  const activities = [
    ...reviews.map((r) => ({ ...r, type: 'review' })),
    ...globalActivities
      .filter((p) => p.status !== 'wishlist')
      .map((p) => ({ ...p, type: 'progress' })),
  ].sort((a, b) => {
    const dateA =
      a.createdAt?.toDate?.() ||
      a.updatedAt?.toDate?.() ||
      a.startedAt?.toDate?.() ||
      new Date(0);
    const dateB =
      b.createdAt?.toDate?.() ||
      b.updatedAt?.toDate?.() ||
      b.startedAt?.toDate?.() ||
      new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // --- Actions ---
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setSelectedBookId(null);
  }, []);

  const handleBookClick = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
  }, []);

  const handleBookAction = useCallback(
    async (book: Book, status: 'reading' | 'wishlist' | 'completed') => {
      if (!user) return;
      try {
        const existing = readingProgress.find((p) => p.bookId === book.id);
        if (existing) {
          await updateDoc(doc(db, 'reading_progress', existing.id!), {
            status,
            userDisplayName: user.displayName,
            userPhotoURL: user.photoURL,
            updatedAt: serverTimestamp(),
          });
          toast.success(`Updated ${book.title} to ${status}`);
        } else {
          await addDoc(collection(db, 'reading_progress'), {
            uid: user.uid,
            userDisplayName: user.displayName,
            userPhotoURL: user.photoURL,
            bookId: book.id,
            status,
            currentPage: 0,
            totalPages: book.pageCount,
            startedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          toast.success(`Added ${book.title} to ${status}`);
        }
        await setDoc(doc(db, 'books', book.id), book);
        cacheBook(book);

        if (status === 'completed') {
          setReviewBook(book);
          setReviewRating(5);
          setReviewText('');
        }
      } catch (error) {
        toast.error('Failed to update book status');
      }
    },
    [user, readingProgress, cacheBook]
  );

  const handleSubmitReview = useCallback(async () => {
    if (!user || !reviewBook) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        uid: user.uid,
        bookId: reviewBook.id,
        rating: reviewRating,
        review: reviewText,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      toast.success('Review shared with the community!');
      setReviewBook(null);
    } catch (error) {
      toast.error('Failed to post review');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [user, reviewBook, reviewRating, reviewText]);

  const handleShare = useCallback(
    (book: Book, platform?: 'twitter' | 'facebook' | 'copy') => {
      const url = window.location.href;
      const text = `Check out "${book.title}" by ${book.authors.join(', ')} on Libris!`;
      if (platform === 'twitter') {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
      } else if (platform === 'facebook') {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
      } else {
        navigator.clipboard.writeText(`${text} ${url}`);
        toast.success('Link copied to clipboard!');
      }
    },
    []
  );

  const handleUpdateGoal = useCallback(
    async (newGoal: number) => {
      try {
        await updateGoal(newGoal);
        toast.success('Reading goal updated!');
      } catch (error) {
        toast.error('Failed to update goal');
      }
    },
    [updateGoal]
  );

  const handleSearchWithTabSwitch = useCallback(
    (e: React.FormEvent) => {
      handleSearch(e);
      setActiveTab('search');
    },
    [handleSearch]
  );

  const handleSelectSuggestionWithTabSwitch = useCallback(
    (book: Book) => {
      selectSuggestion(book);
      setActiveTab('search');
    },
    [selectSuggestion]
  );

  // --- Loading State ---
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest">
            Libris is loading...
          </p>
        </div>
      </div>
    );
  }

  // --- Signed Out State ---
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f5f5f5] p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter">LIBRIS</h1>
            <p className="text-muted-foreground font-medium">
              Your personal library, tracking, and AI reading companion.
            </p>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
            <img
              src="https://picsum.photos/seed/library/800/600"
              alt="Library"
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            Sign in with Google
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- Resolve selected book ---
  const selectedBook = selectedBookId
    ? books[selectedBookId] ||
      searchResults.find((b) => b.id === selectedBookId) ||
      recommendations.find((b) => b.id === selectedBookId) ||
      null
    : null;

  // --- Main App ---
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#141414] font-sans selection:bg-black selection:text-white">
      <Toaster position="top-center" />

      <ReviewDialog
        book={reviewBook}
        rating={reviewRating}
        reviewText={reviewText}
        isSubmitting={isSubmittingReview}
        onRatingChange={setReviewRating}
        onTextChange={setReviewText}
        onSubmit={handleSubmitReview}
        onClose={() => setReviewBook(null)}
      />

      <Sidebar
        activeTab={activeTab}
        selectedBookId={selectedBookId}
        onTabChange={handleTabChange}
        user={user}
        profile={profile}
        onUpdateGoal={handleUpdateGoal}
      />

      <main className="ml-20 md:ml-64 p-6 md:p-10 max-w-7xl mx-auto">
        <Header
          activeTab={activeTab}
          selectedBookId={selectedBookId}
          searchQuery={searchQuery}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onSearchQueryChange={setSearchQuery}
          onShowSuggestions={setShowSuggestions}
          onSearch={handleSearchWithTabSwitch}
          onSelectSuggestion={handleSelectSuggestionWithTabSwitch}
          onSetActiveTab={(tab) => setActiveTab(tab as TabId)}
        />

        <AnimatePresence mode="wait">
          {selectedBookId ? (
            <motion.div
              key="book-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {selectedBook ? (
                <BookDetailView
                  book={selectedBook}
                  libbyAvailability={libbyAvailability}
                  isCheckingLibby={isCheckingLibby}
                  activeTab={activeTab}
                  onBack={() => setSelectedBookId(null)}
                  onAction={handleBookAction}
                  onShare={handleShare}
                />
              ) : (
                <div className="p-20 text-center animate-pulse">
                  Loading book details...
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomePage
                  currentReading={currentReading}
                  books={books}
                  recommendations={recommendations}
                  isRecommending={isRecommending}
                  searchResults={searchResults}
                  feedbackGiven={feedbackGiven}
                  completed={completed}
                  goal={profile?.readingGoal || 12}
                  activities={activities}
                  onBookAction={handleBookAction}
                  onBookClick={handleBookClick}
                  onRecommendationFeedback={handleRecommendationFeedback}
                  onViewCommunity={() => setActiveTab('search')}
                />
              )}
              {activeTab === 'search' && (
                <SearchPage
                  isSearching={isSearching}
                  searchResults={searchResults}
                  onBookAction={handleBookAction}
                  onBookClick={handleBookClick}
                />
              )}
              {activeTab === 'library' && (
                <LibraryPage
                  readingProgress={readingProgress}
                  books={books}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onBookAction={handleBookAction}
                  onBookClick={handleBookClick}
                />
              )}
              {activeTab === 'ai' && <AiPage />}
              {activeTab === 'community' && (
                <CommunityPage
                  activities={activities}
                  books={books}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={handleLoadMore}
                  onBookClick={handleBookClick}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
