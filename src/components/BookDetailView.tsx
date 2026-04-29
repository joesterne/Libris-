import React, { useState, useEffect } from 'react';
import { Book, LibraryAvailability } from '../types';
import { checkLibbyAvailability } from '../lib/googleBooks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Share2,
  Copy,
  Twitter,
  Facebook,
  Star,
  Sparkles,
} from 'lucide-react';

interface BookDetailViewProps {
  book: Book;
  libbyAvailability: LibraryAvailability | null;
  isCheckingLibby: boolean;
  activeTab: string;
  onBack: () => void;
  onAction: (book: Book, status: 'reading' | 'wishlist' | 'completed') => void;
  onShare: (book: Book, platform?: 'twitter' | 'facebook' | 'copy') => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  libbyAvailability,
  isCheckingLibby,
  activeTab,
  onBack,
  onAction,
  onShare,
}) => {
  return (
    <div className="space-y-10">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 rounded-xl font-bold text-xs uppercase tracking-widest"
      >
        ← Back to {activeTab}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-6">
          <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-white group relative">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full w-12 h-12 bg-white text-black hover:scale-110 transition-transform"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]"
                >
                  <DropdownMenuItem
                    onClick={() => onShare(book, 'copy')}
                    className="rounded-xl gap-3 p-3 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      Copy Link
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onShare(book, 'twitter')}
                    className="rounded-xl gap-3 p-3 cursor-pointer"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      Twitter
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onShare(book, 'facebook')}
                    className="rounded-xl gap-3 p-3 cursor-pointer"
                  >
                    <Facebook className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      Facebook
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => onAction(book, 'reading')}
              className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Reading
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onAction(book, 'wishlist')}
                className="flex-1 h-12 rounded-xl font-bold border-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Wishlist
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAction(book, 'completed')}
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
              {book.categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="bg-black/5 text-black border-none font-bold text-[10px] uppercase tracking-widest"
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground font-bold">
              {book.authors.join(', ')}
            </p>
          </div>

          <div className="flex gap-8 py-6 border-y border-black/5">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Rating
              </p>
              <div className="flex items-center gap-1 font-black text-lg">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {book.averageRating || 'N/A'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Pages
              </p>
              <p className="font-black text-lg">{book.pageCount}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Libby
              </p>
              {isCheckingLibby ? (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="text-[10px] font-bold animate-pulse">
                    Checking...
                  </span>
                </div>
              ) : libbyAvailability ? (
                <Badge
                  variant={
                    libbyAvailability.status === 'available'
                      ? 'default'
                      : 'secondary'
                  }
                  className="font-bold text-[10px]"
                >
                  {libbyAvailability.status === 'available'
                    ? 'Available'
                    : libbyAvailability.status === 'waitlist'
                      ? `${libbyAvailability.estimatedWaitWeeks}w wait`
                      : 'N/A'}
                </Badge>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                  N/A
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest">
              About this book
            </h3>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              {book.description || 'No description available for this title.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
