import React from 'react';
import { Book, ReadingProgress } from '../../types';
import { BookCard } from '../BookCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { motion } from 'motion/react';

interface LibraryPageProps {
  readingProgress: ReadingProgress[];
  books: Record<string, Book>;
  sortBy: 'title' | 'author' | 'date';
  onSortChange: (sort: 'title' | 'author' | 'date') => void;
  onBookAction: (book: Book, status: 'reading' | 'wishlist' | 'completed') => void;
  onBookClick: (bookId: string) => void;
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
    <p className="text-muted-foreground font-medium">{message}</p>
  </div>
);

export const LibraryPage: React.FC<LibraryPageProps> = ({
  readingProgress,
  books,
  sortBy,
  onSortChange,
  onBookAction,
  onBookClick,
}) => {
  const currentReading = readingProgress.filter((p) => p.status === 'reading');
  const wishlist = readingProgress.filter((p) => p.status === 'wishlist');
  const completedProgress = readingProgress.filter(
    (p) => p.status === 'completed'
  );

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
        const dateA =
          a.updatedAt?.toDate?.() || a.startedAt?.toDate?.() || new Date(0);
        const dateB =
          b.updatedAt?.toDate?.() || b.startedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  };

  const BookGrid: React.FC<{
    items: ReadingProgress[];
    emptyMessage: string;
  }> = ({ items, emptyMessage }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {sortBooks(items).map(
        (p) =>
          books[p.bookId] && (
            <BookCard
              key={p.id}
              book={books[p.bookId]}
              onAction={onBookAction}
              onClick={onBookClick}
            />
          )
      )}
      {items.length === 0 && <EmptyState message={emptyMessage} />}
    </div>
  );

  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList className="bg-white/50 p-1 rounded-2xl w-fit">
            <TabsTrigger value="all" className="rounded-xl px-8">
              All Books
            </TabsTrigger>
            <TabsTrigger value="reading" className="rounded-xl px-8">
              Reading
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-xl px-8">
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl px-8">
              Completed
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Sort by
            </span>
            <Select
              value={sortBy}
              onValueChange={(v: any) => onSortChange(v)}
            >
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
          <BookGrid
            items={readingProgress}
            emptyMessage="Your library is empty. Start exploring!"
          />
        </TabsContent>

        <TabsContent value="reading">
          <BookGrid
            items={currentReading}
            emptyMessage="No books currently in progress."
          />
        </TabsContent>

        <TabsContent value="wishlist">
          <BookGrid
            items={wishlist}
            emptyMessage="Your wishlist is empty."
          />
        </TabsContent>

        <TabsContent value="completed">
          <BookGrid
            items={completedProgress}
            emptyMessage="You haven't finished any books yet. Keep reading!"
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
