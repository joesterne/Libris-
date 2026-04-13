export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverUrl: string;
  pageCount: number;
  categories: string[];
  averageRating?: number;
}

export interface ReadingProgress {
  id?: string;
  uid: string;
  bookId: string;
  status: 'reading' | 'completed' | 'wishlist';
  currentPage: number;
  totalPages: number;
  startedAt: any;
  updatedAt?: any;
  finishedAt?: any;
}

export interface Review {
  id?: string;
  uid: string;
  bookId: string;
  rating: number;
  review: string;
  createdAt: any;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  readingGoal: number;
  createdAt: any;
}

export interface LibraryAvailability {
  bookId: string;
  status: 'available' | 'waitlist' | 'unavailable';
  estimatedWaitWeeks?: number;
}
