import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { Book, ReadingProgress, Review, UserProfile, LibraryAvailability } from './types';
import { getBookRecommendations } from './lib/gemini';
import { searchBooks, getBookById, checkLibbyAvailability } from './lib/googleBooks';
import { BookCard } from './components/BookCard';
import { LibbyBadge } from './components/LibbyBadge';
import { ChatBot } from './components/ChatBot';
import { GoalTracker } from './components/GoalTracker';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { Progress } from './components/ui/progress';
import { Card, CardContent } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./components/ui/dialog";
import { Slider } from "./components/ui/slider";
import { Label } from "./components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { toast } from 'sonner';
import { 
  Search, 
  BookOpen, 
  Library, 
  MessageSquare, 
  LogOut, 
  Plus, 
  TrendingUp,
  Star,
  Users,
  Home as HomeIcon,
  Sparkles,
  Settings,
  CheckCircle2,
  Share2,
  Copy,
  Twitter,
  Facebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'date'>('date');
  
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(12);
  
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [libbyAvailability, setLibbyAvailability] = useState<LibraryAvailability | null>(null);
  const [isCheckingLibby, setIsCheckingLibby] = useState(false);
  
  const [reviewBook, setReviewBook] = useState<Book | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Libby Availability Effect
  useEffect(() => {
    if (!selectedBookId) {
      setLibbyAvailability(null);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingLibby(true);
      try {
        const result = await checkLibbyAvailability(selectedBookId);
        setLibbyAvailability(result);
      } catch (error) {
        console.error("Libby check failed", error);
      } finally {
        setIsCheckingLibby(false);
      }
    };

    checkAvailability();
  }, [selectedBookId]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'Reader',
            photoURL: u.photoURL || '',
            readingGoal: 12,
            createdAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile as any);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'reading_progress'), where('uid', '==', user.uid));
    const unsubscribeProgress = onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingProgress));
      setReadingProgress(progress);
      
      // Fetch book metadata for these books if not already cached
      progress.forEach(async (p) => {
        if (!books[p.bookId]) {
          const book = await getBookById(p.bookId);
          if (book) setBooks(prev => ({ ...prev, [book.id]: book }));
        }
      });
    });

    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'review' } as any));
      setReviews(revs);
      
      // Fetch book metadata for reviews
      revs.forEach(async (r) => {
        if (!books[r.bookId]) {
          const book = await getBookById(r.bookId);
          if (book) setBooks(prev => ({ ...prev, [book.id]: book }));
        }
      });
    });

    const unsubscribeGlobalProgress = onSnapshot(collection(db, 'reading_progress'), (snapshot) => {
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'progress' } as any));
      setGlobalActivities(progress);

      // Fetch book metadata for global progress
      progress.forEach(async (p) => {
        if (!books[p.bookId]) {
          const book = await getBookById(p.bookId);
          if (book) setBooks(prev => ({ ...prev, [book.id]: book }));
        }
      });
    });

    return () => {
      unsubscribeProgress();
      unsubscribeReviews();
      unsubscribeGlobalProgress();
    };
  }, [user]);

  // Recommendations Effect
  useEffect(() => {
    const fetchRecs = async () => {
      if (!user || readingProgress.length === 0 || recommendations.length > 0) return;
      
      setIsRecommending(true);
      try {
        const historyTitles = readingProgress.map(p => books[p.bookId]?.title).filter(Boolean);
        const currentTitles = readingProgress.filter(p => p.status === 'reading').map(p => books[p.bookId]?.title).filter(Boolean);
        
        const recs = await getBookRecommendations(historyTitles as string[], currentTitles as string[]);
        
        // Fetch full book metadata for recommendations
        const fullRecs = await Promise.all(
          recs.map(async (r: any) => {
            const search = await searchBooks(r.searchQuery || r.title);
            return search[0];
          })
        );
        
        setRecommendations(fullRecs.filter(Boolean));
      } catch (error) {
        console.error("Failed to get recommendations", error);
      } finally {
        setIsRecommending(false);
      }
    };

    fetchRecs();
  }, [user, readingProgress, books]);

  // Search Suggestions Effect
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await searchBooks(searchQuery);
        setSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error("Suggestions fetch failed", error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      toast.error("Failed to search books");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookAction = async (book: Book, status: 'reading' | 'wishlist' | 'completed') => {
    if (!user) return;

    try {
      // Check if already in progress
      const existing = readingProgress.find(p => p.bookId === book.id);
      
      if (existing) {
        await updateDoc(doc(db, 'reading_progress', existing.id!), { 
          status,
          updatedAt: serverTimestamp()
        });
        toast.success(`Updated ${book.title} to ${status}`);
      } else {
        await addDoc(collection(db, 'reading_progress'), {
          uid: user.uid,
          bookId: book.id,
          status,
          currentPage: 0,
          totalPages: book.pageCount,
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success(`Added ${book.title} to ${status}`);
      }
      
      // Cache book metadata
      await setDoc(doc(db, 'books', book.id), book);
      setBooks(prev => ({ ...prev, [book.id]: book }));

      // If marked as completed, prompt for review
      if (status === 'completed') {
        setReviewBook(book);
        setReviewRating(5);
        setReviewText('');
      }

    } catch (error) {
      toast.error("Failed to update book status");
    }
  };

  const handleSubmitReview = async () => {
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
        createdAt: serverTimestamp()
      });
      toast.success("Review shared with the community!");
      setReviewBook(null);
    } catch (error) {
      toast.error("Failed to post review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        readingGoal: tempGoal
      });
      setProfile({ ...profile, readingGoal: tempGoal });
      setIsProfileOpen(false);
      toast.success("Reading goal updated!");
    } catch (error) {
      toast.error("Failed to update goal");
    }
  };

  const handleShare = (book: Book, platform?: 'twitter' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = `Check out "${book.title}" by ${book.authors.join(', ')} on Libris!`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest">Libris is loading...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-muted-foreground font-medium">Your personal library, tracking, and AI reading companion.</p>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
            <img 
              src="https://picsum.photos/seed/library/800/600" 
              alt="Library" 
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <Button onClick={signInWithGoogle} size="lg" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform">
            Sign in with Google
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentReading = readingProgress.filter(p => p.status === 'reading');
  const completed = readingProgress.filter(p => p.status === 'completed').length;
  const wishlist = readingProgress.filter(p => p.status === 'wishlist');

  const activities = [...reviews.map(r => ({ ...r, type: 'review' })), ...globalActivities.filter(p => p.status !== 'wishlist').map(p => ({ ...p, type: 'progress' }))]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.updatedAt?.toDate?.() || a.startedAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.updatedAt?.toDate?.() || b.startedAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

  const sortBooks = (progressList: ReadingProgress[]) => {
    return [...progressList].sort((a, b) => {
      const bookA = books[a.bookId];
      const bookB = books[b.bookId];
      if (!bookA || !bookB) return 0;

      if (sortBy === 'title') {
        return bookA.title.localeCompare(bookB.title);
      }
      if (sortBy === 'author') {
        return (bookA.authors[0] || '').localeCompare(bookB.authors[0] || '');
      }
      if (sortBy === 'date') {
        const dateA = a.updatedAt?.toDate?.() || a.startedAt?.toDate?.() || new Date(0);
        const dateB = b.updatedAt?.toDate?.() || b.startedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  };

  const handleBookClick = (bookId: string) => {
    setSelectedBookId(bookId);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#141414] font-sans selection:bg-black selection:text-white">
      <Toaster position="top-center" />

      {/* Review Dialog */}
      <Dialog open={!!reviewBook} onOpenChange={(open) => !open && setReviewBook(null)}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">How was it?</DialogTitle>
            <DialogDescription>Share your thoughts on "{reviewBook?.title}" with the community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {reviewRating === 5 && "Masterpiece"}
                {reviewRating === 4 && "Great Read"}
                {reviewRating === 3 && "It was okay"}
                {reviewRating === 2 && "Not for me"}
                {reviewRating === 1 && "Disappointing"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Your Review</Label>
              <Textarea 
                placeholder="What did you think about the story, characters, or writing style?"
                className="rounded-2xl bg-black/5 border-none min-h-[120px] focus-visible:ring-black"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setReviewBook(null)} className="rounded-xl">Skip</Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={isSubmittingReview}
              className="flex-1 rounded-xl h-12 font-bold text-lg"
            >
              Post Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-black/5 z-50 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tighter hidden md:block">LIBRIS</h1>
          <div className="w-8 h-8 bg-black rounded-lg md:hidden mx-auto" />
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'home', icon: HomeIcon, label: 'Dashboard' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'library', icon: Library, label: 'My Library' },
            { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
            { id: 'social', icon: Users, label: 'Community' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedBookId(null);
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id && !selectedBookId
                  ? 'bg-black text-white shadow-lg' 
                  : 'text-muted-foreground hover:bg-black/5 hover:text-black'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-bold text-sm hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-black/5">
          <Dialog open={isProfileOpen} onOpenChange={(open) => {
            setIsProfileOpen(open);
            if (open && profile) setTempGoal(profile.readingGoal);
          }}>
            <DialogTrigger>
              <div className="w-full flex items-center gap-3 p-2 rounded-xl bg-black/5 mb-4 hover:bg-black/10 transition-colors text-left cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-black/10 overflow-hidden shrink-0">
                  <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" />
                </div>
                <div className="hidden md:block overflow-hidden flex-1">
                  <p className="text-xs font-bold truncate">{user.displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <Settings className="w-3 h-3 text-muted-foreground hidden md:block" />
              </div>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Profile Settings</DialogTitle>
                <DialogDescription>Manage your reading preferences and goals.</DialogDescription>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-4 border-black/5">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-sm">Annual Reading Goal</Label>
                    <span className="text-xl font-black">{tempGoal} books</span>
                  </div>
                  <Slider 
                    value={[tempGoal]} 
                    onValueChange={(v) => setTempGoal(v[0])} 
                    max={100} 
                    min={1} 
                    step={1}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground italic">Setting a goal helps you stay motivated throughout the year.</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateGoal} className="w-full rounded-xl h-12 font-bold text-lg">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-muted-foreground hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden md:block">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 md:ml-64 p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* Header / Search Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase">
              {selectedBookId ? 'Book Details' : (
                <>
                  {activeTab === 'home' && 'Welcome back'}
                  {activeTab === 'search' && 'Discover'}
                  {activeTab === 'library' && 'Your Collection'}
                  {activeTab === 'ai' && 'AI Companion'}
                  {activeTab === 'social' && 'Reading Feed'}
                </>
              )}
            </h2>
            <p className="text-muted-foreground font-medium">
              {selectedBookId ? 'Explore more about this title.' : (
                <>
                  {activeTab === 'home' && "Here's what's happening in your library today."}
                  {activeTab === 'search' && "Find your next favorite story."}
                </>
              )}
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <form onSubmit={handleSearch}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-black transition-colors" />
              <Input 
                placeholder="Search by title, author, or genre..." 
                className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-black"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden z-[60]"
                >
                  <ScrollArea className="max-h-[300px]">
                    {suggestions.map((book) => (
                      <button
                        key={book.id}
                        className="w-full p-4 flex gap-4 hover:bg-black/5 transition-colors text-left border-b border-black/5 last:border-none"
                        onClick={() => {
                          setSearchQuery(book.title);
                          setSearchResults([book]);
                          setActiveTab('search');
                          setShowSuggestions(false);
                        }}
                      >
                        <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-bold line-clamp-1">{book.title}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">{book.authors.join(', ')}</p>
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
            
            {showSuggestions && (
              <div 
                className="fixed inset-0 z-[55]" 
                onClick={() => setShowSuggestions(false)} 
              />
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {selectedBookId ? (
            <motion.div
              key="book-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <Button 
                variant="ghost" 
                onClick={() => setSelectedBookId(null)}
                className="mb-4 rounded-xl font-bold text-xs uppercase tracking-widest"
              >
                ← Back to {activeTab}
              </Button>

              {(() => {
                const book = books[selectedBookId] || searchResults.find(b => b.id === selectedBookId) || recommendations.find(b => b.id === selectedBookId);
                if (!book) return <div className="p-20 text-center animate-pulse">Loading book details...</div>;
                
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                      <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-white group relative">
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="secondary" size="icon" className="rounded-full w-12 h-12 bg-white text-black hover:scale-110 transition-transform">
                                <Share2 className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                              <DropdownMenuItem onClick={() => handleShare(book, 'copy')} className="rounded-xl gap-3 p-3 cursor-pointer">
                                <Copy className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-widest">Copy Link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(book, 'twitter')} className="rounded-xl gap-3 p-3 cursor-pointer">
                                <Twitter className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-widest">Twitter</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(book, 'facebook')} className="rounded-xl gap-3 p-3 cursor-pointer">
                                <Facebook className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-widest">Facebook</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => handleBookAction(book, 'reading')}
                          className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg"
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          Start Reading
                        </Button>
                        <div className="flex gap-3">
                          <Button 
                            variant="outline"
                            onClick={() => handleBookAction(book, 'wishlist')}
                            className="flex-1 h-12 rounded-xl font-bold border-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Wishlist
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => handleBookAction(book, 'completed')}
                            className="flex-1 h-12 rounded-xl font-bold bg-black/5"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Read
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                          {book.categories.map(cat => (
                            <Badge key={cat} variant="secondary" className="bg-black/5 text-black border-none font-bold text-[10px] uppercase tracking-widest">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-none">{book.title}</h1>
                        <p className="text-xl text-muted-foreground font-bold">{book.authors.join(', ')}</p>
                      </div>

                      <div className="flex gap-8 py-6 border-y border-black/5">
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rating</p>
                          <div className="flex items-center gap-1 font-black text-lg">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {book.averageRating || 'N/A'}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pages</p>
                          <p className="font-black text-lg">{book.pageCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Libby</p>
                          {isCheckingLibby ? (
                            <div className="flex items-center justify-center gap-2">
                              <Sparkles className="w-3 h-3 animate-spin text-blue-500" />
                              <span className="text-[10px] font-bold animate-pulse">Checking...</span>
                            </div>
                          ) : libbyAvailability ? (
                            <Badge variant={libbyAvailability.status === 'available' ? 'default' : 'secondary'} className="font-bold text-[10px]">
                              {libbyAvailability.status === 'available' ? 'Available' : libbyAvailability.status === 'waitlist' ? `${libbyAvailability.estimatedWaitWeeks}w wait` : 'N/A'}
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest">About this book</h3>
                        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                          {book.description || "No description available for this title."}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ) : activeTab === 'home' && (
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
                      {currentReading.map(p => {
                        const book = books[p.bookId];
                        if (!book) return null;
                        return (
                          <div 
                            key={p.id} 
                            className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 items-center relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-black outline-none" 
                            onClick={() => handleBookClick(book.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`View progress for ${book.title}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleBookClick(book.id);
                              }
                            }}
                          >
                            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md">
                              <img src={book.coverUrl} alt={`Cover of ${book.title}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-bold line-clamp-1">{book.title}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{book.authors[0]}</p>
                                </div>
                                <LibbyBadge bookId={book.id} />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span>{Math.round((p.currentPage / p.totalPages) * 100)}%</span>
                                  <span>{p.currentPage}/{p.totalPages} pages</span>
                                </div>
                                <Progress value={(p.currentPage / p.totalPages) * 100} className="h-1.5" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white/50 border-2 border-dashed border-black/5 rounded-3xl p-12 text-center">
                      <p className="text-muted-foreground font-medium">Not reading anything right now. Time to start a new adventure?</p>
                      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setActiveTab('search')}>Browse Books</Button>
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
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                          <div className="aspect-[2/3] bg-black/5 rounded-2xl animate-pulse" />
                          <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
                        </div>
                      ))
                    ) : recommendations.length > 0 ? (
                      recommendations.map(book => (
                        <div key={book.id} className="space-y-3">
                          <BookCard book={book} onAction={handleBookAction} onClick={handleBookClick} />
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 bg-white shadow-sm hover:bg-black hover:text-white transition-all"
                            onClick={() => handleBookAction(book, 'wishlist')}
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            Add to Wishlist
                          </Button>
                        </div>
                      ))
                    ) : (
                      searchResults.slice(0, 4).map(book => (
                        <div key={book.id} className="space-y-3">
                          <BookCard book={book} onAction={handleBookAction} onClick={handleBookClick} />
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 bg-white shadow-sm hover:bg-black hover:text-white transition-all"
                            onClick={() => handleBookAction(book, 'wishlist')}
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            Add to Wishlist
                          </Button>
                        </div>
                      ))
                    )}
                    {!isRecommending && recommendations.length === 0 && searchResults.length === 0 && Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-4">
                        <div className="aspect-[2/3] bg-black/5 rounded-2xl animate-pulse" />
                        <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-10">
                <GoalTracker 
                  completed={completed} 
                  goal={profile?.readingGoal || 12} 
                  currentReading={currentReading.length} 
                />
                
                <Card className="border-none shadow-lg bg-black text-white rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold tracking-tight">Reading Streak</h4>
                    <p className="text-white/60 text-sm">You've read for 5 days in a row! Keep it up to reach your weekly goal.</p>
                    <div className="flex gap-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className={`flex-1 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${i < 5 ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
                          {day}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {isSearching ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="aspect-[2/3] bg-black/5 rounded-2xl animate-pulse" />
                      <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {searchResults.map(book => (
                    <div key={book.id} className="space-y-3">
                      <BookCard book={book} onAction={handleBookAction} onClick={handleBookClick} />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 bg-white shadow-sm hover:bg-black hover:text-white transition-all"
                        onClick={() => handleBookAction(book, 'wishlist')}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add to Wishlist
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">Search for your next book</h3>
                  <p className="text-muted-foreground">Enter a title, author, or topic to explore millions of books.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <TabsList className="bg-white/50 p-1 rounded-2xl w-fit">
                    <TabsTrigger value="all" className="rounded-xl px-8">All Books</TabsTrigger>
                    <TabsTrigger value="reading" className="rounded-xl px-8">Reading</TabsTrigger>
                    <TabsTrigger value="wishlist" className="rounded-xl px-8">Wishlist</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl px-8">Completed</TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sort by</span>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-[140px] bg-white border-none shadow-sm rounded-xl h-9 text-xs font-bold">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="date">Date Added</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="all">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {sortBooks(readingProgress).map(p => books[p.bookId] && (
                      <BookCard key={p.id} book={books[p.bookId]} onAction={handleBookAction} onClick={handleBookClick} />
                    ))}
                    {readingProgress.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
                        <p className="text-muted-foreground font-medium">Your library is empty. Start exploring!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="reading">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {sortBooks(currentReading).map(p => books[p.bookId] && (
                    <BookCard key={p.id} book={books[p.bookId]} onAction={handleBookAction} onClick={handleBookClick} />
                  ))}
                  {currentReading.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
                      <p className="text-muted-foreground font-medium">No books currently in progress.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="wishlist">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {sortBooks(wishlist).map(p => books[p.bookId] && (
                    <BookCard key={p.id} book={books[p.bookId]} onAction={handleBookAction} onClick={handleBookClick} />
                  ))}
                  {wishlist.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
                      <p className="text-muted-foreground font-medium">Your wishlist is empty.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {sortBooks(readingProgress.filter(p => p.status === 'completed')).map(p => books[p.bookId] && (
                    <BookCard key={p.id} book={books[p.bookId]} onAction={handleBookAction} onClick={handleBookClick} />
                  ))}
                  {completed === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
                      <p className="text-muted-foreground font-medium">You haven't finished any books yet. Keep reading!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <ChatBot />
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div 
              key="social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Community Feed</h2>
                <Badge variant="secondary" className="bg-black/5 text-black border-none font-bold text-[10px] uppercase tracking-widest">
                  {activities.length} Recent Activities
                </Badge>
              </div>

              {activities.length > 0 ? (
                activities.map(activity => {
                  const book = books[activity.bookId];
                  const isReview = activity.type === 'review';
                  
                  return (
                    <Card key={activity.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                          <Avatar className="w-10 h-10 border-2 border-black/5">
                            <AvatarImage src={activity.userPhotoURL || activity.photoURL || ''} />
                            <AvatarFallback>{(activity.userDisplayName || 'R')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm">{activity.userDisplayName || 'A Reader'}</span>
                              <span className="text-xs text-muted-foreground">
                                {isReview ? 'reviewed' : activity.status === 'completed' ? 'finished reading' : 'started reading'}
                              </span>
                              <span 
                                className="font-bold text-sm cursor-pointer hover:underline focus-visible:ring-2 focus-visible:ring-black outline-none rounded-sm" 
                                onClick={() => handleBookClick(activity.bookId)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleBookClick(activity.bookId);
                                  }
                                }}
                                aria-label={`View details for ${book?.title}`}
                              >
                                {book?.title || 'a book'}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                              {activity.createdAt?.toDate?.().toLocaleDateString() || activity.updatedAt?.toDate?.().toLocaleDateString() || 'Recently'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-6 bg-black/[0.02] p-4 rounded-2xl">
                          <div 
                            className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-black outline-none" 
                            onClick={() => handleBookClick(activity.bookId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleBookClick(activity.bookId);
                              }
                            }}
                            aria-label={`View cover for ${book?.title}`}
                          >
                            <img src={book?.coverUrl || `https://picsum.photos/seed/${activity.bookId}/200/300`} alt={`Cover of ${book?.title}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 space-y-3">
                            {isReview ? (
                              <>
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < activity.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
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
                                    ? "Completed this journey! 🎉" 
                                    : `Currently on page ${activity.currentPage} of ${activity.totalPages}`}
                                </p>
                                {activity.status === 'reading' && (
                                  <div className="mt-3 space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <span>{Math.round((activity.currentPage / activity.totalPages) * 100)}%</span>
                                    </div>
                                    <Progress value={(activity.currentPage / activity.totalPages) * 100} className="h-1.5" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
                  <p className="text-muted-foreground font-medium">No community activity yet. Be the first to share!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
